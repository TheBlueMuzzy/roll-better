import { useState } from 'react';
import { useGameStore } from '../store/gameStore';

interface SettingsProps {
  open: boolean;
  onClose: () => void;
  onOpenHowToPlay: () => void;
}

export function Settings({ open, onClose, onOpenHowToPlay }: SettingsProps) {
  const audioVolume = useGameStore((s) => s.settings.audioVolume);
  const performanceMode = useGameStore((s) => s.settings.performanceMode);
  const tipsEnabled = useGameStore((s) => s.settings.tipsEnabled);
  const confirmationEnabled = useGameStore((s) => s.settings.confirmationEnabled);
  const setAudioVolume = useGameStore((s) => s.setAudioVolume);
  const setPerformanceMode = useGameStore((s) => s.setPerformanceMode);
  const setTipsEnabled = useGameStore((s) => s.setTipsEnabled);
  const setConfirmationEnabled = useGameStore((s) => s.setConfirmationEnabled);
  const setScreen = useGameStore((s) => s.setScreen);

  const [quitConfirm, setQuitConfirm] = useState(false);

  if (!open) return null;

  const handleQuitYes = () => {
    setQuitConfirm(false);
    onClose();
    setScreen('menu');
  };

  const handleQuitNo = () => {
    setQuitConfirm(false);
  };

  return (
    <div className="settings-backdrop" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <span className="settings-title">Settings</span>
          <button className="settings-close" onClick={onClose}>
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
                  {performanceMode === 'advanced' ? 'Advanced' : 'Simple'}
                </span>
              </div>
            </div>
          </div>

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
            <button className="settings-h2p" onClick={onOpenHowToPlay}>
              {'\u{1F4D6}'} How to Play
            </button>
          </div>

          {/* Divider */}
          <div className="settings-divider" />

          {/* Main Menu */}
          <div className="settings-item">
            {!quitConfirm ? (
              <button className="settings-quit" onClick={() => setQuitConfirm(true)}>
                Main Menu
              </button>
            ) : (
              <div className="settings-quit-confirm">
                <span className="settings-quit-text">Are you sure?</span>
                <div className="settings-quit-actions">
                  <button className="settings-quit-yes" onClick={handleQuitYes}>
                    Yes
                  </button>
                  <button className="settings-quit-no" onClick={handleQuitNo}>
                    No
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
