import { useState, useEffect, useRef, useCallback } from 'react';

interface Slide {
  title: string;
  text: string;
  icon: string;
}

// Placeholder visuals — will be replaced with screenshots/illustrations later
const SLIDES: Slide[] = [
  {
    title: 'Roll Your Dice',
    icon: '\u{1F3B2}',
    text: 'Tap anywhere to roll. Your dice tumble with real physics \u2014 every roll is unique!',
  },
  {
    title: 'Match the Goal',
    icon: '\u{1F3AF}',
    text: 'The Goal row at the top shows 8 target dice. When your roll matches a Goal die, it locks automatically.',
  },
  {
    title: 'Unlock for More',
    icon: '\u{1F513}',
    text: 'Tap locked dice to select them, then press UNLOCK. Each unlocked die returns to your pool with a bonus die!',
  },
  {
    title: 'Score Big',
    icon: '\u2B50',
    text: 'Match all 8 Goal dice to win the round. Fewer dice in your pool means a higher score \u2014 up to 8 points!',
  },
  {
    title: 'Stay Competitive',
    icon: '\u2696\uFE0F',
    text: 'After each round, winners start with fewer dice and losers get more. Every round is anyone\u2019s game!',
  },
  {
    title: 'Race to 20',
    icon: '\u{1F3C6}',
    text: 'First player to reach 20 points wins the session. Play smart \u2014 speed vs. efficiency is the core tension.',
  },
];

interface HowToPlayProps {
  onClose: () => void;
}

export function HowToPlay({ onClose }: HowToPlayProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchCurrentX = useRef<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const totalSlides = SLIDES.length;

  // Arrow key navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [totalSlides, onClose]);

  // Touch handlers — coords tracked in refs, only setState on final slide
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
    // Remove transition during drag for immediate feedback
    if (trackRef.current) {
      trackRef.current.style.transition = 'none';
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    touchCurrentX.current = e.touches[0].clientX;
    // Live drag preview: translate follows finger with resistance at edges
    const delta = touchCurrentX.current - touchStartX.current;
    const baseTranslate = -(currentSlide * 100);
    // Convert pixel delta to percentage of container width
    if (trackRef.current) {
      const containerWidth = trackRef.current.parentElement?.clientWidth || 1;
      let pctDelta = (delta / containerWidth) * 100;
      // Add resistance at edges
      if ((currentSlide === 0 && delta > 0) || (currentSlide === totalSlides - 1 && delta < 0)) {
        pctDelta *= 0.3;
      }
      trackRef.current.style.transform = `translateX(${baseTranslate + pctDelta}%)`;
    }
  }, [currentSlide, totalSlides]);

  const handleTouchEnd = useCallback(() => {
    // Restore transition for snap
    if (trackRef.current) {
      trackRef.current.style.transition = 'transform 0.3s ease-out';
    }
    if (touchStartX.current === null || touchCurrentX.current === null) return;
    const delta = touchCurrentX.current - touchStartX.current;
    if (Math.abs(delta) > 50) {
      if (delta < 0) {
        // Swipe left → next slide
        setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
      } else {
        // Swipe right → prev slide
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
      }
    } else {
      // Snap back — reset transform to current slide position
      if (trackRef.current) {
        trackRef.current.style.transform = `translateX(-${currentSlide * 100}%)`;
      }
    }
    touchStartX.current = null;
    touchCurrentX.current = null;
  }, [currentSlide, totalSlides]);

  return (
    <div className="h2p-backdrop" onClick={onClose}>
      <div className="h2p-card" onClick={(e) => e.stopPropagation()}>
        <button className="h2p-close" onClick={onClose}>
          &#x2715;
        </button>

        <div className="h2p-nav-row">
          <button
            className={`h2p-arrow${currentSlide === 0 ? ' hidden' : ''}`}
            onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 0))}
          >
            &#x2039;
          </button>
          <div
            className="h2p-viewport"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              ref={trackRef}
              className="h2p-track"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {SLIDES.map((slide, i) => (
                <div className="h2p-slide" key={i}>
                  <div className="h2p-visual">
                    <span className="h2p-icon">{slide.icon}</span>
                  </div>
                  <h3 className="h2p-title">{slide.title}</h3>
                  <p className="h2p-text">{slide.text}</p>
                </div>
              ))}
            </div>
          </div>
          <button
            className={`h2p-arrow${currentSlide === totalSlides - 1 ? ' hidden' : ''}`}
            onClick={() => setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1))}
          >
            &#x203A;
          </button>
        </div>

        <div className="h2p-dots">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={`h2p-dot${i === currentSlide ? ' h2p-dot--active' : ''}`}
              onClick={() => setCurrentSlide(i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
