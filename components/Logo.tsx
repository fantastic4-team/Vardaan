import Image from "next/image";

// public/images/logo.png is 913x157.
const LOGO_WIDTH = 913;
const LOGO_HEIGHT = 157;

type LogoProps = {
  /** Rendered height in px; the width follows the logo's aspect ratio. */
  height: number;
  className?: string;
  priority?: boolean;
};

export default function Logo({ height, className = "", priority = false }: LogoProps) {
  return (
    <Image
      src="/images/logo.png"
      alt="Vardaan"
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      priority={priority}
      className={`select-none ${className}`}
      style={{ height, width: Math.round((height * LOGO_WIDTH) / LOGO_HEIGHT) }}
      draggable={false}
    />
  );
}
