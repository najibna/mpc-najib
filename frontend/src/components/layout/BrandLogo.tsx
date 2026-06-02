type Props = {
  /** Height of the logo in pixels (width scales automatically). */
  height?: number;
  className?: string;
};

/** Intact Insurance wordmark from approved SVG asset. */
export default function BrandLogo({ height = 32, className = "" }: Props) {
  return (
    <img
      src="/intactinsurance.svg"
      alt="Intact Insurance"
      height={height}
      className={`w-auto select-none object-contain ${className}`}
      style={{ height }}
      draggable={false}
    />
  );
}
