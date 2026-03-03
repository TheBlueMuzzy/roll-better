import { useEffect, useRef } from 'react';

export function TouchIndicator() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const activeTouches = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const handleTouchStart = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const circle = document.createElement('div');
        circle.className = 'touch-circle holding';
        circle.style.left = `${touch.clientX - 25}px`;
        circle.style.top = `${touch.clientY - 25}px`;
        overlay.appendChild(circle);
        activeTouches.current.set(touch.identifier, circle);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const circle = activeTouches.current.get(touch.identifier);
        if (!circle) continue;
        activeTouches.current.delete(touch.identifier);

        // Switch to releasing animation
        circle.className = 'touch-circle releasing';
        circle.style.left = `${touch.clientX - 40}px`;
        circle.style.top = `${touch.clientY - 40}px`;

        // Remove after animation completes
        setTimeout(() => {
          circle.remove();
        }, 300);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  return <div ref={overlayRef} className="touch-overlay" />;
}
