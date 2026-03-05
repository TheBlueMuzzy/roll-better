import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { playUIClick } from '../utils/soundManager';

interface SettingsProps {
  open: boolean;
  onClose: () => void;
  onOpenHowToPlay: () => void;
  shakeSupported?: boolean;
}

export function Settings({ open, onClose, onOpenHowToPlay, shakeSupported }: SettingsProps) {
  const screen = useGameStore((s) => s.screen);
  const audioVolume = useGameStore((s) => s.settings.audioVolume);
  const performanceMode = useGameStore((s) => s.settings.performanceMode);
  const shakeToRollEnabled = useGameStore((s) => s.settings.shakeToRollEnabled);
  const tipsEnabled = useGameStore((s) => s.settings.tipsEnabled);
  const confirmationEnabled = useGameStore((s) => s.settings.confirmationEnabled);
  const setAudioVolume = useGameStore((s) => s.setAudioVolume);
  const setPerformanceMode = useGameStore((s) => s.setPerformanceMode);
  const setShakeToRollEnabled = useGameStore((s) => s.setShakeToRollEnabled);
  const setTipsEnabled = useGameStore((s) => s.setTipsEnabled);
  const setConfirmationEnabled = useGameStore((s) => s.setConfirmationEnabled);
  const setScreen = useGameStore((s) => s.setScreen);

  const [quitConfirm, setQuitConfirm] = useState(false);

  // Reset quit confirmation when panel closes
  useEffect(() => {
    if (!open) setQuitConfirm(false);
  }, [open]);

  if (!open) return null;

  const handleQuit = () => {
    if (quitConfirm) {
      setQuitConfirm(false);
      onClose();
      setScreen('menu');
    } else {
      setQuitConfirm(true);
    }
  };

  return (
    <div className="settings-backdrop" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <span className="settings-title">Settings</span>
          <button className="settings-close" onClick={() => { playUIClick(); onClose(); }}>
            &#x2715;
          </button>
        </div>

        <div className="settings-items">
          {/* Audio Volume */}
          <div className="settings-item">
            <div className="settings-item-row">
              <span className="settings-label">Audio</span>
              <span className="settings-value">{audioVolume}</span>
            </div>
            <input
              className="settings-slider"
              type="range"
              min={0}
              max={100}
              step={1}
              value={audioVolume}
              onChange={(e) => setAudioVolume(Number(e.target.value))}
            />
          </div>

          {/* Performance Mode */}
          <div className="settings-item">
            <div className="settings-item-row">
              <span className="settings-label">Performance</span>
              <div className="settings-toggle-group">
                <div
                  className={`settings-toggle${performanceMode === 'advanced' ? ' on' : ''}`}
                  onClick={() => setPerformanceMode(performanceMode === 'advanced' ? 'simple' : 'advanced')}
                >
                  <div className="settings-toggle-thumb" />
                </div>
                <span className="settings-hint">
                  {performanceMode === 'advanced' ? 'Best visuals' : 'Better battery'}
                </span>
              </div>
            </div>
          </div>

          {/* Shake to Roll Toggle — only on supported devices */}
          {shakeSupported && (
            <div className="settings-item">
              <div className="settings-item-row">
                <span className="settings-label">Shake to Roll</span>
                <div className="settings-toggle-group">
                  <div
                    className={`settings-toggle${shakeToRollEnabled ? ' on' : ''}`}
                    onClick={() => setShakeToRollEnabled(!shakeToRollEnabled)}
                  >
                    <div className="settings-toggle-thumb" />
                  </div>
                  <span className="settings-hint">
                    {shakeToRollEnabled ? 'On' : 'Off'}
                  </span>
                </div>
              </div>
            </div>
          )}


          {/* Tips Toggle */}
          <div className="settings-item">
            <div className="settings-item-row">
              <span className="settings-label">Tips</span>
              <div className="settings-toggle-group">
                <div
                  className={`settings-toggle${tipsEnabled ? ' on' : ''}`}
                  onClick={() => setTipsEnabled(!tipsEnabled)}
                >
                  <div className="settings-toggle-thumb" />
                </div>
                <span className="settings-hint">
                  {tipsEnabled ? 'On' : 'Off'}
                </span>
              </div>
            </div>
          </div>

          {/* Confirmation Toggle */}
          <div className="settings-item">
            <div className="settings-item-row">
              <span className="settings-label">Confirmation</span>
              <div className="settings-toggle-group">
                <div
                  className={`settings-toggle${confirmationEnabled ? ' on' : ''}`}
                  onClick={() => setConfirmationEnabled(!confirmationEnabled)}
                >
                  <div className="settings-toggle-thumb" />
                </div>
                <span className="settings-hint">
                  {confirmationEnabled ? 'On' : 'Off'}
                </span>
              </div>
            </div>
          </div>

          {/* How to Play */}
          <div className="settings-item">
            <button className="settings-h2p" onClick={() => { playUIClick(); onOpenHowToPlay(); }}>
              {'\u{1F4D6}'} How to Play
            </button>
          </div>

          {/* Divider */}
          <div className="settings-divider" />

          {/* Main Menu — only visible during game, not from menu screen */}
          {screen === 'game' && (
            <div className="settings-item">
              <button
                className={`settings-quit${quitConfirm ? ' confirming' : ''}`}
                onClick={handleQuit}
              >
                {quitConfirm ? 'Are you sure?' : 'Main Menu'}
              </button>
            </div>
          )}

          <div className="settings-privacy-link">
            <a href="privacy.html" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
