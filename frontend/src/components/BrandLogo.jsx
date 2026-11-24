import React from "react";

/**
 * DepositGuard Brand Logo Component
 *
 * Renders the realistic Indian architectural shield emblem (derived from user design:
 * Mehrab gateway arch, stepped sandstone ghats, modern home, gold lock-shield, and key)
 * with zero-blur pixel locking, High-DPI Retina super-sampling, and a regal heritage
 * ambient animation system (separated halo glow + specular sunbeam sweep).
 *
 * Variants:
 * - "light" (default): Crisp charcoal & jewel emerald for porcelain/ivory backgrounds.
 * - "dark": Luminous white & emerald typography for dark/night mode backgrounds.
 * - "icon": Standalone emblem mark for mobile navigation, avatars, and compact badges.
 */
export default function BrandLogo({
  variant = "light",
  className,
  showTagline = true,
  iconOnly = false,
  animated = true,
  onClick,
  href,
  ...props
}) {
  const isIcon = variant === "icon" || iconOnly;
  const isDark = variant === "dark";

  // Default generous sizes for prominent visibility & commanding presence
  const defaultSizeClass = isIcon
    ? "h-10 w-10 sm:h-12 sm:w-12"
    : "h-14 sm:h-16 md:h-18 w-auto";

  const sizeClass = className || defaultSizeClass;

  // Ultra-resolution 4K/Retina assets (512px height master density)
  const logoSrc = isDark
    ? "/depositguard-logo-ultra-dark.png"
    : "/depositguard-logo-ultra.png";
  const logoFallback = isDark
    ? "/depositguard-logo-dark.png"
    : "/depositguard-logo-tight.png";

  const emblemSrc = "/depositguard-emblem-ultra.png";
  const emblemFallback = "/depositguard-emblem-tight.png";

  const logoNode = (
    <div
      className={`relative inline-flex items-center group select-none shrink-0 ${
        isIcon ? "" : ""
      }`}
      {...props}
    >
      {/* 
        Layer 1: Ambient Heritage Halo Glow
        Rendered on a completely isolated background layer behind the emblem.
        Pulses smoothly with zero impact on the crispness of the logo image itself.
      */}
      {animated && (
        <div
          className="absolute inset-0 -m-3 rounded-full pointer-events-none opacity-40 group-hover:opacity-95 transition-opacity duration-500 ease-out animate-logo-halo"
          style={{
            background: isDark
              ? "radial-gradient(ellipse at 25% 50%, rgba(16, 185, 129, 0.35) 0%, rgba(245, 158, 11, 0.22) 40%, transparent 70%)"
              : "radial-gradient(ellipse at 25% 50%, rgba(16, 185, 129, 0.25) 0%, rgba(217, 119, 6, 0.18) 45%, transparent 70%)",
            filter: "blur(12px)",
          }}
          aria-hidden="true"
        />
      )}

      {/* 
        Layer 2: Main Image Frame
        Zero-blur GPU isolation: static 1:1 pixel coordinates, no fractional scaling
      */}
      <div className="relative inline-flex items-center overflow-hidden rounded-lg">
        {isIcon ? (
          <img
            src={emblemSrc}
            srcSet={`${emblemSrc} 2x, ${emblemFallback} 1x`}
            alt="DepositGuard Shield Emblem"
            className={`${sizeClass} object-contain dg-logo-img select-none`}
            draggable={false}
            loading="eager"
            decoding="sync"
          />
        ) : (
          <img
            src={logoSrc}
            srcSet={`${logoSrc} 2x, ${logoFallback} 1x`}
            alt="DepositGuard - Rental Deposit Protection"
            className={`${sizeClass} object-contain dg-logo-img select-none`}
            draggable={false}
            loading="eager"
            decoding="sync"
          />
        )}

        {/* 
          Layer 3: Royal Sunlight Gleam Sweep
          Glides across the golden shield and emerald gateway at steady, graceful intervals
        */}
        {animated && (
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg"
            aria-hidden="true"
          >
            <div
              className="w-1/2 h-full animate-logo-sheen group-hover-sheen"
              style={{
                background:
                  "linear-gradient(110deg, transparent 15%, rgba(255, 255, 255, 0.45) 45%, rgba(251, 191, 36, 0.35) 52%, transparent 75%)",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        onClick={onClick}
        className="inline-flex items-center focus:outline-none"
        title="DepositGuard - Rental Deposit Protection"
      >
        {logoNode}
      </a>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center focus:outline-none cursor-pointer p-0 bg-transparent border-0"
        title="DepositGuard - Rental Deposit Protection"
      >
        {logoNode}
      </button>
    );
  }

  return logoNode;
}
