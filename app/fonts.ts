import localFont from 'next/font/local';

// Not preloaded: preloading every weight queued ~30 font files ahead of the
// page's content. The browser still fetches the weights a page uses.
export const lato = localFont({
  variable: '--font-lato-family',
  display: 'swap',
  preload: false,
  src: [
    { path: '../public/fonts/static/Lato-Thin.woff2', weight: '100', style: 'normal' },
    { path: '../public/fonts/static/Lato-Light.woff2', weight: '300', style: 'normal' },
    { path: '../public/fonts/static/Lato-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/static/Lato-Bold.woff2', weight: '700', style: 'normal' },
    { path: '../public/fonts/static/Lato-Black.woff2', weight: '900', style: 'normal' },
    { path: '../public/fonts/static/Lato-ThinItalic.woff2', weight: '100', style: 'italic' },
    { path: '../public/fonts/static/Lato-LightItalic.woff2', weight: '300', style: 'italic' },
    { path: '../public/fonts/static/Lato-Italic.woff2', weight: '400', style: 'italic' },
    { path: '../public/fonts/static/Lato-BoldItalic.woff2', weight: '700', style: 'italic' },
  ],
});

export const workSans = localFont({
  variable: '--font-work-sans',
  display: 'swap',
  preload: false,
  /* Static weights only. The variable files (~128 KB each) overlapped every
     weight here and won the match, so a page using just Regular downloaded
     the whole variable font instead of a ~57 KB static. */
  src: [
    { path: '../public/fonts/static/WorkSans-Thin.woff2', weight: '100', style: 'normal' },
    { path: '../public/fonts/static/WorkSans-ExtraLight.woff2', weight: '200', style: 'normal' },
    { path: '../public/fonts/static/WorkSans-Light.woff2', weight: '300', style: 'normal' },
    { path: '../public/fonts/static/WorkSans-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/static/WorkSans-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/static/WorkSans-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/static/WorkSans-Bold.woff2', weight: '700', style: 'normal' },
    { path: '../public/fonts/static/WorkSans-ExtraBold.woff2', weight: '800', style: 'normal' },
    { path: '../public/fonts/static/WorkSans-Black.woff2', weight: '900', style: 'normal' },
    { path: '../public/fonts/static/WorkSans-ThinItalic.woff2', weight: '100', style: 'italic' },
    { path: '../public/fonts/static/WorkSans-ExtraLightItalic.woff2', weight: '200', style: 'italic' },
    { path: '../public/fonts/static/WorkSans-LightItalic.woff2', weight: '300', style: 'italic' },
    { path: '../public/fonts/static/WorkSans-Italic.woff2', weight: '400', style: 'italic' },
    { path: '../public/fonts/static/WorkSans-MediumItalic.woff2', weight: '500', style: 'italic' },
    { path: '../public/fonts/static/WorkSans-SemiBoldItalic.woff2', weight: '600', style: 'italic' },
    { path: '../public/fonts/static/WorkSans-BoldItalic.woff2', weight: '700', style: 'italic' },
    { path: '../public/fonts/static/WorkSans-ExtraBoldItalic.woff2', weight: '800', style: 'italic' },
    { path: '../public/fonts/static/WorkSans-BlackItalic.woff2', weight: '900', style: 'italic' },
  ],
});

// Landing page only, so it is loaded on the routes that render the landing
// shell rather than app-wide. Only the weights the design uses are listed.
export const tomatoGrotesk = localFont({
  variable: '--font-tomato-grotesk',
  display: 'swap',
  src: [
    { path: '../public/fonts/static/TomatoGrotesk-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/static/TomatoGrotesk-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/static/TomatoGrotesk-Bold.woff2', weight: '700', style: 'normal' },
    { path: '../public/fonts/static/TomatoGrotesk-BoldSlanted.woff2', weight: '700', style: 'italic' },
  ],
});
