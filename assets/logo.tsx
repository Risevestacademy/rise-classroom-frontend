import Image from "next/image"

import { cn } from "@/lib/utils"

const logoVariant = {
  teal: {
    src: "/classroom-logo-teal.svg",
    textColor: "text-text-brand",
  },
  white: {
    src: "/classroom-logo-white.svg",
    textColor: "text-neutral-50",
  },
} 

const logoSize = {
  sm: { icon: "h-8 w-auto", text: "text-sm leading-4" },
  lg: { icon: "h-10 w-auto", text: "text-lg leading-5" },
} 

type LogoVariant = keyof typeof logoVariant
type LogoSize = keyof typeof logoSize

function Logo({
  variant,
  size = "lg",
  className,
}: {
  variant: LogoVariant
  size?: LogoSize
  className?: string
}) {
  const { src, textColor } = logoVariant[variant]
  const { icon, text } = logoSize[size]

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image
        src={src}
        alt=""
        width={37}
        height={31}
        className={icon}
      />

      <span className={cn(
        "flex flex-col items-start justify-start font-bold",
        textColor,
        text
      )}>
        <span>rise</span>
        <span className="font-medium">Classroom</span>
      </span>
    </div>
  )
}

export { Logo }
