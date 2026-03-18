/**
 * Lightweight browser engine detection for conditional rendering.
 * Uses layered feature checks + UA sniffing as fallback.
 */

const ua = typeof navigator !== "undefined" ? navigator.userAgent : ""

/** True for Blink-based engines (Chrome, Edge, Opera, etc.) */
export const isChromium = (): boolean =>
  !!(window as unknown as Record<string, unknown>).chrome &&
  !ua.includes("Edg/") === false &&
  !ua.includes("Firefox")

/** True for WebKit (Safari — not Chrome which also uses WebKit on iOS) */
export const isWebKit = (): boolean =>
  ua.includes("AppleWebKit") && !ua.includes("Chrome") && !ua.includes("Chromium")

/** True for Gecko (Firefox) */
export const isGecko = (): boolean => ua.includes("Firefox") || ua.includes("Gecko/")

/** True when SVG backdrop-filter with feDisplacementMap works (Chromium only as of 2026) */
export const supportsBackdropSvgFilter = (): boolean =>
  !isWebKit() && !isGecko()
