# Roll Better — Core Rules (v2)

**Date:** 2026-02-28
**Source:** Muzzy's design notes

---

## Session Structure
- A **session** is a series of **rounds** played until someone reaches **20 points**
- Multiple players can cross 20 on the same round → multi-winner
- **2–8 players** per session

## Round Setup
- Roll 8 dice → sort by number → this is the **Goal**
  - Example: [1,1,2,3,3,3,5,6] → two 1s, one 2, three 3s, one 5, one 6
- Goal dice are white, displayed horizontally at the top of the screen, sorted left to right
- New Goal dice roll across the screen with physics, then lerp to their sorted positions
- Each player starts with their **starting dice count** in their pool (default 2, modified by handicap)

## Turn Flow (simultaneous, all players)
1. **"Roll Better"** prompt appears → shake phone (mobile) or click roll button (PC)
2. **3D dice roll** with physics across the entire screen (except Goal area), then settle
3. **Auto-lock**: Matching dice automatically lerp to their slot under the matching Goal die
   - Lock-in limit: up to the Goal's count per number (Goal has three 3s → max three 3s locked)
   - Players may also choose NOT to lock a matching die (it stays in pool)
4. Non-matching dice lerp back to the dice pool at the bottom
5. **Winner check**: Does any player have all 8 locked matching the Goal?
   - If YES → **Scoring** (see below), then new round
   - If NO → continue to step 6
6. **Unlock phase**: Drag locked dice down to the bottom area to return them
   - Each returned die lerps to your pool
   - PLUS a bonus die lerps FROM the Goal die it was under TO your pool (looks like Goal dice "spawn" new dice of your color)
   - Alternative: tap to unlock (if tap mode enabled in settings)
7. **Repeat** from step 1

## Scoring (when someone wins a round)
- **8 points max** per round
- Penalty per remaining pool die (not locked): penalties = `[1, 0, 1, 1]`
  - 0 remaining → 8 pts (perfect)
  - 1 remaining → 7 pts
  - 2 remaining → 7 pts
  - 3 remaining → 6 pts
  - 4 remaining → 5 pts
- **Scoring animation**: Locked dice lerp to your pool. Goal dice lerp "points" to your point display, counting up (1 per die, capped at your actual max based on pool size)
- All players who complete the Goal on the same turn score

## Between Rounds (handicap — applies every round)
- **Won** this round → starting dice count decreases by 1 (minimum 1)
- **Failed** this round → starting dice count increases by 1 (maximum 12)
- Z value in your HUD animates (scale pop) and increments/decrements
- New Goal is rolled, pools reset to new starting dice count

---

## Screen Layout

### Top: Goal Row
- 8 white Goal dice, sorted by number, horizontal
- Each Goal die has a **colored circle indicator** showing which player has the most dice locked under it
  - 1 player leading: solid color
  - 2-way tie: circle split in 2 colors
  - 3-way tie: 3 color wedges (120°), etc.
- When 1+ players lock all 8, the indicators show those players

### Middle: Player Rows
- **Your row** is directly below the Goal (closest to you)
- Other players' rows below yours
- Each row has 8 slots corresponding to the 8 Goal dice above
- Locked dice appear in their matching slot (your dice color)
- **Player icon** on the left of each row
  - Center of icon: current **point total**
  - Bottom of icon: **X/Y/Z** display

### Bottom: Your Dice Pool & Rolling Area
- Unlocked dice live here
- 3D dice roll with physics in this area
- **HUD in lower left**: X/Y/Z
  - **X** = dice currently in your pool
  - **Y** = max dice allowable (12)
  - **Z** = starting dice count this round
- **Score** displayed above the X/Y/Z

### Other Players' Dice
- When other players roll and lock dice, their dice lerp from their player icon into their row slots
- Their X/Y/Z visible on their icon

---

## Visual & Interaction Design

### Dice
- **3D dice** with physics
- Goal dice: white
- Player dice: randomly assigned color per player
- All movement animations use **lerping**

### Rolling
- **Mobile**: Shake phone when "Roll Better" prompt appears
- **PC**: Click roll button (mouse-based rolling planned for later)
- Dice roll across the entire screen except the Goal row
- After settling, dice lerp to their result positions

### Unlocking (Interaction Flow)
- On entering unlock phase, **all locked dice** show white outline + slight scale pulse to indicate they're unlockable
- **Tap** a locked die to toggle selection: selected = **shrinks 25%**, tap again = scales back to full size
- An **"UNLOCK" button** (in HUD) confirms the selection
- Player can forego unlocking by confirming with nothing selected (just taps UNLOCK with no dice selected → proceeds to roll)
- **ANY locked die** can be unlocked, even from previous turns
- Each unlocked die returns to pool **+1 bonus die** from the Goal slot it was under (pool grows by 2 per unlock)

### Unlocking (Animation — Phase 6)
- Unlocked die **lerps** from player row back to dice pool area
- Bonus die **lerps FROM the Goal die** it was under **TO the pool** (Goal dice appear to "spawn" new dice of your color)
- **Drag** as alternative to tap (drag locked die down to bottom area to return it)

---

## Key Strategic Tensions
- **Grow vs. stay lean**: Returning dice grows pool fast (+1 per return) but every extra die past 8 costs 2 points
- **Lock vs. skip**: You can leave a match unlocked — useful for keeping pool flexible
- **Speed vs. score**: Finishing first matters, but a bloated pool means low/zero points
- **Handicap spiral**: Winners get fewer starting dice → harder next round → natural catch-up
- **20-point race**: Do you play aggressively for fast rounds (low score) or carefully for high scores (slower)?
