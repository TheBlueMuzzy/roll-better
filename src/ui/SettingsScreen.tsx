// SETTINGS — the kit's Settings block, rows from content/ui/settings.json (Muzzy edits that file).
// Values live in the game store, exactly as before (not saved between visits, same as before).
// Opened with screens.push('settings'); Back, Esc, phone Back and tapping the dim close it.
import { Settings, screens, type SettingsValues } from './kit'
import settingsList from '../../content/ui/settings.json'
import { useGameStore } from '../store/gameStore'
import { playUIClick } from '../utils/soundManager'

// Store → the rows' values. "Performance" on = best visuals ('advanced').
function loadFromStore(): SettingsValues {
  const s = useGameStore.getState().settings
  return {
    audioVolume: s.audioVolume,
    performanceMode: s.performanceMode === 'advanced',
    tipsEnabled: s.tipsEnabled,
    confirmationEnabled: s.confirmationEnabled,
  }
}

// The rows' values → store (same store actions the old Settings used)
function saveToStore(values: SettingsValues) {
  const store = useGameStore.getState()
  const s = store.settings
  if (values.audioVolume !== s.audioVolume) store.setAudioVolume(Number(values.audioVolume))
  const mode = values.performanceMode ? 'advanced' : 'simple'
  if (mode !== s.performanceMode) store.setPerformanceMode(mode)
  if (values.tipsEnabled !== s.tipsEnabled) store.setTipsEnabled(values.tipsEnabled === true)
  if (values.confirmationEnabled !== s.confirmationEnabled) store.setConfirmationEnabled(values.confirmationEnabled === true)
}

// Rows that only make sense during a game
const IN_GAME_ONLY = ['unstick', 'mainMenu']

export function SettingsScreen({ onUnstick }: { onUnstick: () => void }) {
  const screen = useGameStore((s) => s.screen)
  const close = () => { playUIClick(); screens.pop() }

  const onAction = (id: string) => {
    if (id === 'unstick') { onUnstick(); close() }
    if (id === 'credits') screens.push('credits')
    if (id === 'mainMenu') { screens.pop(); useGameStore.getState().setScreen('menu') }
  }

  return (
    <Settings schema={settingsList} load={loadFromStore} save={saveToStore} onAction={onAction}
      onBack={close} hide={screen === 'game' ? [] : IN_GAME_ONLY} />
  )
}
