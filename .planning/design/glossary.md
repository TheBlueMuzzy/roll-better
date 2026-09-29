# Roll Better — Glossary
> Detail for GDD (all docs) — keep in step with GDD.md. Moved out of the GDD 2026-09-28 (word for word).

## 12. Glossary
- **Goal**: The 8 white dice at the top of the screen that all players race to match
- **Lock / Lock-in**: Automatically placing a matching die in its slot under the Goal die
- **Unlock / Mitosis**: Dragging a locked die back into the rolling area — at turn end it splits into 2 (original + bonus), giving you a net +1 total dice
- **Dice pool**: Your available dice at the bottom of the screen, ready to roll
- **Pool size**: Number of unlocked dice in your rolling pool
- **Total dice**: Pool + locked. Capped at 12.
- **Starting dice (Z)**: How many dice you begin each round with, modified by handicap
- **Handicap**: Win a round → -1 starting die. Lose → +1 starting die. Applied every round.
- **Must-unlock**: If pool = 0 and locked < 8, you must unlock at least 1 die before rolling
- **Session**: A series of rounds played until someone reaches 20 points
- **Round**: One Goal, rolled repeatedly until someone locks all 8
- **Turn**: One roll cycle within a round (roll → lock → check → unlock → repeat)
- **Room code**: 4-letter alphabetic code (excludes I, O) used to join an online game — Jackbox-style, zero friction
- **AFK timer**: 20-second countdown on the roll. When expired, the game rolls for the player that turn only.
- **Inactivity timer**: 3-second countdown in the unlock turn, restarted by every drag; when it runs out the turn ends.
- **Gather**: Holding in the rolling area to pull your dice into an orbit before releasing them as a roll.
- **AI takeover**: When a player disconnects or times out, AI seamlessly controls their dice until they reconnect
- **AI backfill**: AI opponents that fill empty player slots when the host starts the game
- **PartyKit**: WebSocket room server running on Cloudflare's edge network
- **Deferred snapshot**: Pattern where server state is buffered until client animations finish, preventing visual glitches
- **Watchdog**: Heartbeat that detects phase stalls and requests state sync from server
- **Profile-emerge**: Animation pattern where other players' dice scale from 0→1 and fly from their profile icon to their row slots
