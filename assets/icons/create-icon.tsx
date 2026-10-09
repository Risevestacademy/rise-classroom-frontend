import * as React from "react";

/** Icon styles from the Figma "Iconography" frame. Not every icon has every style. */
export type IconVariant = "stroke" | "twotone" | "duotone" | "solid" | "bulk";

export type IconProps<V extends IconVariant = IconVariant> = React.SVGProps<SVGSVGElement> & {
  /** Which Figma variant to render. Defaults to `stroke` (or the icon's only variant). */
  variant?: V;
  /** Sets both width and height. Tailwind size classes (`size-5`, `h-4 w-4`) override it. */
  size?: number | string;
};

export type IconComponent<V extends IconVariant = IconVariant> = React.FC<IconProps<V>> & {
  variants: readonly V[];
};

/**
 * Builds an icon component from its variant bodies. Shapes use `currentColor`,
 * so colour comes from the text colour (`className="text-brand-primary"`) or the `color` prop.
 */
export function createIcon<V extends IconVariant>(
  displayName: string,
  variants: Record<V, React.ReactNode>,
  defaultVariant: NoInfer<V>,
): IconComponent<V> {
  function Icon({ variant = defaultVariant, size = 24, ...props }: IconProps<V>) {
    const labelled = props["aria-label"] != null || props["aria-labelledby"] != null;
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden={labelled ? undefined : true}
        role={labelled ? "img" : undefined}
        {...props}
      >
        {variants[variant] ?? variants[defaultVariant]}
      </svg>
    );
  }
  Icon.displayName = displayName;
  Icon.variants = Object.keys(variants) as V[];
  return Icon;
}

/** Re-exports an icon under another name with different defaults (used for legacy names). */
export function withDefaults<V extends IconVariant>(
  Icon: IconComponent<V>,
  defaults: Pick<IconProps<V>, "size" | "variant">,
  displayName: string,
): IconComponent<V> {
  const Aliased = (props: IconProps<V>) => <Icon {...defaults} {...props} />;
  Aliased.displayName = displayName;
  Aliased.variants = Icon.variants;
  return Aliased;
}
