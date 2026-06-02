import { PRODUCT_TAGLINE } from "../copy";

type Props = {
  className?: string;
};

/** One short line — avoid crowding the page. */
export default function DataHonestyBanner({ className = "" }: Props) {
  return (
    <p className={`text-sm text-charcoal-muted ${className}`}>{PRODUCT_TAGLINE}</p>
  );
}
