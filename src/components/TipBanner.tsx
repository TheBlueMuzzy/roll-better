import { useEffect, useRef, useState, useCallback } from 'react';

interface TipBannerProps {
  text: string;
  onDismiss: () => void;
}

export function TipBanner({ text, onDismiss }: TipBannerProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Trigger entry animation after mount
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      triggerExit();
    }, 4000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

  const triggerExit = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    setVisible(false);
    // Wait for fade-out transition (200ms) then call onDismiss
    exitTimerRef.current = setTimeout(() => {
      onDismiss();
    }, 200);
  }, [exiting, onDismiss]);

  const handleTap = () => {
    // Clear auto-dismiss timer and exit immediately
    if (timerRef.current) clearTimeout(timerRef.current);
    triggerExit();
  };

  return (
    <div
      className={`tip-banner${visible ? ' tip-visible' : ''}`}
      onClick={handleTap}
    >
      <span>{text}</span>
      <button className="tip-close" onClick={handleTap} aria-label="Dismiss tip">
        &times;
      </button>
    </div>
  );
}
