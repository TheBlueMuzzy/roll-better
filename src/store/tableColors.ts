// The 3D table's colours while the game runs. Starts from content/ui/table.json.
// The Dev Kit's Table tab (src/devkit-game/TableTab.tsx) changes them live with tableColors.set(); the Scene
// listens with tableColors.subscribe() and repaints the materials directly — no React re-render.
import table from '../../content/ui/table.json';

export type TableColors = { rows: string; rolling: string; divider: string; dividerOpacity: number };

let current: TableColors = {
  rows: table.rows,
  rolling: table.rolling,
  divider: table.divider,
  dividerOpacity: table.dividerOpacity,
};
const listeners = new Set<(colors: TableColors) => void>();

export const tableColors = {
  get: () => current,
  set(next: TableColors) {
    current = next;
    listeners.forEach((listen) => listen(current));
  },
  subscribe(listen: (colors: TableColors) => void) {
    listeners.add(listen);
    return () => { listeners.delete(listen); };
  },
};
