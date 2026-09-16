/**
 * Detects if the current user is accessing via a mobile device/tablet.
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;

  const ua = (navigator.userAgent || navigator.vendor || (window as any).opera || '').toLowerCase();
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
  const isSmallScreen = window.innerWidth <= 768;
  const hasTouchScreen =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 1 ||
    (navigator as any).msMaxTouchPoints > 1;

  return isMobileUA || (isSmallScreen && hasTouchScreen);
}
