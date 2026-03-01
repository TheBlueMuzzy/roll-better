interface SettingsProps {
  open: boolean;
  onClose: () => void;
}

export function Settings({ open, onClose }: SettingsProps) {
  if (!open) return null;

  return (
    <div className="settings-backdrop" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <span className="settings-title">Settings</span>
          <button className="settings-close" onClick={onClose}>
            &#x2715;
          </button>
        </div>
      </div>
    </div>
  );
}
