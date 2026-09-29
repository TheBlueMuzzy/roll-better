// DEV KIT SAVE ENDPOINT — lets Dev Kit tools write their changes into content/ JSON files.
// Only exists while `npm run dev` is running (apply: 'serve'); the live build has no such endpoint.
//
//   POST /__devkit/save   body: { "path": "content/ui/table.json", "data": { ... } }
//
// Safety: only .json files inside content/ — nothing else in the project can be written.
// Files are written pretty-printed (2 spaces) with a trailing newline, and a "_help" note already
// in the file is kept even if the tool didn't send it.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve, sep } from 'node:path'
import type { Plugin } from 'vite'

export const SAVE_URL = '/__devkit/save'

/** Is this a path the Dev Kit may write? e.g. "content/ui/style.json" yes; "src/App.tsx", "../x.json" no. */
export function isAllowedContentPath(path: unknown): path is string {
  if (typeof path !== 'string') return false
  if (!path.startsWith('content/')) return false // relative, forward slashes, inside content/
  if (!path.endsWith('.json')) return false
  if (path.includes('\\') || path.includes('\0')) return false
  const parts = path.split('/')
  return parts.every((part) => part !== '' && part !== '.' && part !== '..')
}

/** Keep the file's "_help" note (first, as it was) if the new data doesn't bring its own. */
export function keepHelp(existing: unknown, incoming: Record<string, unknown>): Record<string, unknown> {
  const help = (existing as Record<string, unknown> | null)?._help
  if (help === undefined || '_help' in incoming) return incoming
  return { _help: help, ...incoming }
}

/** How every Dev Kit file is written: 2-space JSON + a newline at the end (like a hand-edited file). */
export function formatJson(data: unknown): string {
  return JSON.stringify(data, null, 2) + '\n'
}

// Same file, same key — whatever slashes or drive-letter case the path came with (Windows)
const fileKey = (file: string) => resolve(file).toLowerCase()

export function devkitSave(): Plugin {
  let root = process.cwd()
  // Files we just wrote: Vite would hot-reload the game for them, but the game already shows
  // those values live, so we skip that reload (it would reset the game under Muzzy's feet).
  const justWrote = new Map<string, number>()

  return {
    name: 'bmuz-devkit-save',
    apply: 'serve',
    configResolved(config) {
      root = config.root
    },
    configureServer(server) {
      server.middlewares.use(SAVE_URL, (req, res) => {
        const reply = (status: number, body: object) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(body))
        }
        if (req.method !== 'POST') return reply(405, { error: 'POST only' })
        // Only the game's own page may save: the dev server is on the Wi-Fi (--host), and any web page
        // could otherwise POST here. A same-page fetch sends Origin = this server; JSON forces that check.
        const origin = req.headers.origin
        const host = req.headers.host
        if (!origin || !host || new URL(origin).host !== host) return reply(403, { error: 'Save only from the game page' })
        if (!String(req.headers['content-type'] ?? '').startsWith('application/json')) return reply(415, { error: 'JSON only' })

        let raw = ''
        req.on('data', (chunk) => (raw += chunk))
        req.on('end', () => {
          try {
            const { path, data } = JSON.parse(raw)
            if (!isAllowedContentPath(path)) return reply(400, { error: `Not allowed: only .json files inside content/ (got ${path})` })
            if (typeof data !== 'object' || data === null || Array.isArray(data)) return reply(400, { error: 'data must be a JSON object' })

            const contentDir = resolve(root, 'content')
            const file = resolve(root, path)
            if (!file.startsWith(contentDir + sep)) return reply(400, { error: 'Not allowed: outside content/' })
            if (!existsSync(dirname(file))) return reply(400, { error: `No such folder: ${dirname(path)}` })

            const existing = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null
            justWrote.set(fileKey(file), Date.now())
            writeFileSync(file, formatJson(keepHelp(existing, data)))
            server.config.logger.info(`[devkit] saved ${path}`, { timestamp: true })
            reply(200, { ok: true, path })
          } catch (e) {
            reply(500, { error: String(e) })
          }
        })
      })
    },
    handleHotUpdate({ file }) {
      const wroteAt = justWrote.get(fileKey(file))
      if (wroteAt !== undefined && Date.now() - wroteAt < 3000) {
        justWrote.delete(fileKey(file))
        return [] // no reload — see justWrote above
      }
    },
  }
}
