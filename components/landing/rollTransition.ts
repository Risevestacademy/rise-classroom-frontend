/**
 * How far the canvas reaches past the panel's top and bottom, as a fraction of
 * the panel's height, so the rolling edge can bulge out of the frame.
 */
export const ROLL_OVERFLOW = 0.14;

const VERTEX = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

// The new screen is revealed left to right. Behind the moving edge it swells
// vertically (tallest at the edge, flat again WIDTH later) and smears with
// motion blur and colour fringing, like paper unrolling towards you.
const FRAGMENT = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uFrom;
uniform sampler2D uTo;
uniform float uProgress;
uniform float uOverflow;
uniform float uRadius;
uniform vec2 uRes;

const float WIDTH = 0.34;
const float BULGE = 0.26;

float roundedMask(vec2 uv, vec2 size) {
  vec2 p = uv * size;
  vec2 q = abs(p - size * 0.5) - (size * 0.5 - uRadius);
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
  return clamp(0.5 - d, 0.0, 1.0);
}

void main() {
  vec2 panel = vec2(uRes.x, uRes.y / (1.0 + 2.0 * uOverflow));
  float x = vUv.x;
  float y = vUv.y * (1.0 + 2.0 * uOverflow) - uOverflow;
  float edge = uProgress * (1.0 + WIDTH);
  float d = edge - x;

  if (d < 0.0) {
    vec2 uv = vec2(x, y);
    float a = roundedMask(uv, panel);
    vec3 col = texture2D(uFrom, uv).rgb;
    col *= 1.0 - 0.5 * exp(d / 0.035) * smoothstep(0.0, 0.08, uProgress);
    gl_FragColor = vec4(col * a, a);
    return;
  }

  float f = pow(1.0 - clamp(d / WIDTH, 0.0, 1.0), 2.4);
  float amp = BULGE * smoothstep(0.0, 0.12, uProgress);
  float ys = 0.5 + (y - 0.5) / (1.0 + amp * f);
  vec2 uv = vec2(x, ys);
  float a = roundedMask(uv, panel);

  float blur = 0.045 * f;
  float fringe = 0.012 * f;
  vec3 col = vec3(0.0);
  for (int i = 0; i < 9; i++) {
    float o = (float(i) / 8.0 - 0.5) * blur;
    col.r += texture2D(uTo, vec2(x + o - fringe, ys)).r;
    col.g += texture2D(uTo, vec2(x + o, ys)).g;
    col.b += texture2D(uTo, vec2(x + o + fringe, ys)).b;
  }
  col /= 9.0;
  col = mix(col, vec3(1.0), 0.18 * pow(f, 6.0));
  gl_FragColor = vec4(col * a, a);
}`;

export type RollRenderer = {
  draw: (
    from: HTMLImageElement,
    to: HTMLImageElement,
    progress: number,
  ) => void;
  /** Matches the drawing buffer to the canvas's on-screen size. */
  resize: (radiusCssPx: number) => void;
  dispose: () => void;
};

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

/** Returns null when WebGL isn't available, so callers can fall back. */
export function createRollRenderer(
  canvas: HTMLCanvasElement,
): RollRenderer | null {
  const gl = canvas.getContext("webgl", {
    premultipliedAlpha: true,
    antialias: false,
  });
  if (!gl) return null;

  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  const aPos = gl.getAttribLocation(program, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uniform = (name: string) => gl.getUniformLocation(program, name);
  const uProgress = uniform("uProgress");
  const uRes = uniform("uRes");
  const uRadius = uniform("uRadius");
  gl.uniform1i(uniform("uFrom"), 0);
  gl.uniform1i(uniform("uTo"), 1);
  gl.uniform1f(uniform("uOverflow"), ROLL_OVERFLOW);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  const textures = new Map<HTMLImageElement, WebGLTexture>();
  const bind = (unit: number, image: HTMLImageElement) => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    let texture = textures.get(image);
    if (texture) {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      return;
    }
    texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    textures.set(image, texture);
  };

  return {
    resize(radiusCssPx) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uRadius, radiusCssPx * dpr);
    },
    draw(from, to, progress) {
      bind(0, from);
      bind(1, to);
      gl.uniform1f(uProgress, progress);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    dispose() {
      textures.forEach((texture) => gl.deleteTexture(texture));
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    },
  };
}
