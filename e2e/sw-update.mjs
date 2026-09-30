// Returning player gets a new release on their FIRST visit (offline cache swaps itself). Guards the registerSW({ immediate: true }) line in src/main.tsx.
// Builds twice (second with version.json build 99, restored after), serves on :5193. Run alone: npm run e2e:update
import { chromium } from 'playwright-core'
import { execSync, spawn } from 'node:child_process'
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const sh = (c) => execSync(c, { stdio: 'pipe', env: { ...process.env, DEVKIT_IN_RELEASE: 'false' } })
const vj = readFileSync('version.json', 'utf8')
const verText = async (p) => ((await p.locator('body').innerText()).match(/v\d+\.\d+\.\d+\.\d+/) || ['none'])[0]
let server, ctx, result = 1
try {
  sh('npx vite build')
  server = spawn('npx vite preview --port 5193 --strictPort', { shell: true })
  await new Promise((r) => setTimeout(r, 4000))
  ctx = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), 'sw-')), { viewport: { width: 1280, height: 720 } })
  const p = ctx.pages()[0] || (await ctx.newPage())
  let reloads = 0
  p.on('framenavigated', (f) => { if (f === p.mainFrame()) reloads++ })
  await p.goto('http://localhost:5193/roll-better/')
  await p.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 30000 })
  await p.waitForTimeout(1500)
  console.log('first visit:', await verText(p))
  // publish a "next release" underneath the open page
  const v = JSON.parse(vj); v.build = 99
  writeFileSync('version.json', JSON.stringify(v, null, 2) + '\n')
  sh('npx vite build')
  const before = reloads
  // what a returning player does: open the link again
  await p.goto('http://localhost:5193/roll-better/')
  await p.waitForTimeout(12000)
  const shown = await verText(p)
  console.log('after one visit:', shown, '| page swapped itself:', reloads - before > 1 ? 'yes' : 'no')
  result = shown.endsWith('.99') ? 0 : 1
} finally {
  writeFileSync('version.json', vj)
  await ctx?.close()
  if (server) { try { execSync(`taskkill /PID ${server.pid} /T /F`, { stdio: 'ignore' }) } catch {} }
}
console.log(result === 0 ? 'PASS — returning player sees the new version on the first visit' : 'FAIL — returning player still sees the old version')
process.exit(result)
