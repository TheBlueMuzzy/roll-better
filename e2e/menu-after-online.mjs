// Check: leaving an ONLINE game from the winners screen (Menu), then starting a SOLO game, must not
// show the "Reconnecting…" dialog (the old leave closed the socket in a way that looked like a drop).
// Run: npm run e2e:menu   (starts its own PartyKit + Vite and stops them afterwards)
import { startServer, launchBrowser, store, run, log, GAME_URL, VITE_PORT, PARTY_PORT, createRoom, joinRoom, startOnlineGame, text } from './lib.mjs';

run(async () => {
  await startServer('partykit', `npx partykit dev --port ${PARTY_PORT}`, PARTY_PORT);
  await startServer('vite', `npx vite --port ${VITE_PORT} --strictPort`, VITE_PORT, { VITE_PARTY_HOST: `localhost:${PARTY_PORT}` });
  const browser = await launchBrowser();
  const page = async () => (await browser.newContext({ viewport: { width: 1000, height: 560 } })).newPage();
  const [p1, p2] = [await page(), await page()];
  const errors = [];
  p1.on('pageerror', (e) => errors.push(e.message));
  for (const p of [p1, p2]) await p.goto(GAME_URL);
  const code = await createRoom(p1);
  await joinRoom(p2, code);
  await p1.waitForTimeout(1500);
  await startOnlineGame(p1);
  await p1.waitForTimeout(4000);

  // Jump P1 to the winners screen (session over), then press Menu there
  await store(p1, `s.getState().setScreen('winners');`);
  await p1.getByRole('button', { name: text.winners.quit }).click();
  await p1.waitForTimeout(1500);
  const backAtMenu = await store(p1, `return s.getState().screen === 'menu';`);

  // Start a solo game and watch for the Reconnecting dialog
  await p1.getByRole('button', { name: text.mainMenu.play, exact: true }).click();
  await p1.waitForTimeout(5000);
  const reconnecting = await p1.getByText(text.reconnecting.title).isVisible().catch(() => false);
  const inGame = await store(p1, `return s.getState().screen === 'game' && !s.getState().isOnlineGame;`);
  await browser.close();

  const checks = [];
  const check = (name, pass) => { checks.push(pass); log(pass ? '  ok  ' : '  FAIL', name); };
  check('Menu on the winners screen goes back to the main menu', backAtMenu);
  check('a solo game starts after leaving the online game', inGame);
  check('no "Reconnecting" dialog over the solo game', !reconnecting);
  check('no page errors', errors.length === 0);
  if (errors.length) log('page errors:', errors);
  return checks.every(Boolean);
});
