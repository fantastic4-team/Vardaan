type LogoProps = {
  className?: string;
};

export default function Logo({ className = "" }: LogoProps) {
  return (
    <span
      className={`font-logo font-extrabold uppercase leading-none tracking-[0.01em] text-ink ${className}`}
      aria-label="Vardaan"
    >
      Vardaan
    </span>
  );
}
