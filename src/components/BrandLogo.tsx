import SafeImage from "@/components/SafeImage";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  size?: number;
  className?: string;
  /** Decorative when adjacent wordmark is visible. */
  decorative?: boolean;
  priority?: boolean;
};

/** Site mark: `/logo.webp` with compact text-mark fallback (never a broken img). */
export default function BrandLogo({
  size = 32,
  className,
  decorative = false,
  priority = false,
}: BrandLogoProps) {
  return (
    <SafeImage
      src="/logo.webp"
      alt={decorative ? "" : "MagicRemover"}
      width={size}
      height={size}
      compact
      markFallback="MR"
      className={cn("object-contain", className)}
      priority={priority}
    />
  );
}
