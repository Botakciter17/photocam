import { soundEffects } from '../engine/SoundEffects';

/**
 * Dispatches a synthetic click event to the topmost interactive element under the cursor.
 */
export function dispatchVirtualClick(x: number, y: number): HTMLElement | null {
  const element = document.elementFromPoint(x, y) as HTMLElement | null;
  if (!element) return null;

  // Look for element or ancestor marked with data-interactive or standard buttons
  const target = (element.closest('[data-interactive="true"]') ||
    element.closest('button') ||
    element.closest('a') ||
    element) as HTMLElement;

  if (target) {
    soundEffects.playClick();

    // Trigger visual ripple
    createClickRipple(x, y);

    // Dispatch native click events
    const clickEvent = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y
    });

    target.dispatchEvent(clickEvent);
    if (typeof (target as any).click === 'function') {
      (target as any).click();
    }
    return target;
  }

  return null;
}

/**
 * Creates an ephemeral visual ripple on screen at click coordinates.
 */
export function createClickRipple(x: number, y: number) {
  const ripple = document.createElement('div');
  ripple.style.position = 'fixed';
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  ripple.style.width = '24px';
  ripple.style.height = '24px';
  ripple.style.borderRadius = '50%';
  ripple.style.backgroundColor = 'rgba(56, 189, 248, 0.7)';
  ripple.style.boxShadow = '0 0 20px rgba(56, 189, 248, 0.9)';
  ripple.style.transform = 'translate(-50%, -50%) scale(1)';
  ripple.style.transition = 'all 0.4s cubic-bezier(0.1, 0.8, 0.2, 1)';
  ripple.style.pointerEvents = 'none';
  ripple.style.zIndex = '99999';

  document.body.appendChild(ripple);

  requestAnimationFrame(() => {
    ripple.style.transform = 'translate(-50%, -50%) scale(4)';
    ripple.style.opacity = '0';
  });

  setTimeout(() => {
    if (ripple.parentNode) {
      ripple.parentNode.removeChild(ripple);
    }
  }, 450);
}
