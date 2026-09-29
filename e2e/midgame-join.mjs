// Online check for F52 — joining a game already in progress with the kit SeatPicker.
// P1 + P2 start a game (bots fill the empty seats). P3 then joins with the room code:
//   - P3 sees the seat picker ("Game in progress") listing the bot seats
//   - picking one shows the joining state, and P3 ends up in the game at the next round
// Screenshots go to the folder given as the first argument (optional).
// Run: npm run e2e:midgame   (starts its own PartyKit :2999 + Vite :5199 and stops them afterwards)
import { startServer, launchBrowser, run, log, GAME_URL, VITE_PORT, PARTY_PORT, createRoom, joinRoom, startOnlineGame, store, text } from './lib.mjs';

const SHOTS = process.argv[2];

run(async () => {
  await startServer('partykit', `npx partykit dev --port ${PARTY_PORT}`, PARTY_PORT);
  await startServer('vite', `npx vite --port ${VITE_PORT} --strictPort`, VITE_PORT, { VITE_PARTY_HOST: `localhost:${PARTY_PORT}` });
  const browser = await launchBrowser();
  const page = async () => (await browser.newContext({ viewport: { width: 844, height: 390 } })).newPage();
  const [p1, p2, p3] = [await page(), await page(), await page()];
  const errors = [];
  for (const [n, p] of [['P1', p1], ['P2', p2], ['P3', p3]]) p.on('pageerror', (e) => errors.push(`${n}: ${e.message}`));

  for (const p of [p1, p2, p3]) await p.goto(GAME_URL);
  const code = await createRoom(p1);
  await joinRoom(p2, code);
  await p1.waitForTimeout(1500);
  await startOnlineGame(p1);
  await p1.waitForTimeout(5000);
  log('game started with P1 + P2 (+ bots)');

  // P3 joins mid-game: Play online → code → Join → the seat picker
  await p3.getByRole('button', { name: text.mainMenu.playOnline }).click();
  const boxes = p3.getByRole('textbox', { name: /letter \d of 4/ });
  for (let i = 0; i < 4; i++) await boxes.nth(i).fill(code[i]);
  await p3.getByRole('button', { name: text.lobby.join }).click();
  const picker = p3.getByText(text.seats.title, { exact: true });
  const sawPicker = await picker.waitFor({ timeout: 15000 }).then(() => true, () => false);
  await p3.waitForTimeout(1200); // let the screen's entrance animation finish
  // Each seat is a button whose name includes its stats line ("Score 0 · Locks 0/8")
  const seatButtons = p3.getByRole('button', { name: /Locks \d+\/8/ });
  const seatCount = sawPicker ? await seatButtons.count() : 0;
  if (SHOTS) await p3.screenshot({ path: `${SHOTS}/seat-picker.png` });
  log('seat picker:', sawPicker, 'seats:', seatCount);

  let joining = false; let inGame = false;
  if (seatCount > 0) {
    await seatButtons.first().click();
    joining = await p3.getByText(text.seats.joining).or(p3.getByText(text.seats.reclaiming)).first()
      .waitFor({ timeout: 10000 }).then(() => true, () => false);
    if (SHOTS) await p3.screenshot({ path: `${SHOTS}/seat-joining.png` });
    // Joining happens at the next round boundary — wait for P3's game screen
    const t0 = Date.now();
    while (Date.now() - t0 < 180_000 && !inGame) {
      inGame = await store(p3, `return s.getState().screen === 'game';`).catch(() => false);
      if (!inGame) await p3.waitForTimeout(2000);
    }
    if (SHOTS) await p3.screenshot({ path: `${SHOTS}/seat-in-game.png` });
  }
  await browser.close();

  const checks = [];
  const check = (name, pass) => { checks.push(pass); log(pass ? '  ok  ' : '  FAIL', name); };
  check('P3 sees the seat picker (game in progress)', sawPicker);
  check('it lists at least one bot seat', seatCount > 0);
  check('picking a seat shows the joining state', joining);
  check('P3 is in the game after the round ends', inGame);
  check('no page errors', errors.length === 0);
  if (errors.length) log('page errors:', errors);
  return checks.every(Boolean);
});
