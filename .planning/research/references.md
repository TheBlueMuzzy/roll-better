# Roll Better -- Design Research & References

**Date:** 2026-02-27

---

## Player Personas

### Persona A: "Lunch Break Lisa"
- **Age:** 38, marketing coordinator, mother of two
- **Bartle Type:** Socializer (primary) / Achiever (secondary)
- **Plays:** 2-3 sessions/day, 5-15 min each. iPhone + work laptop browser
- **Plays:** Wordle, NYT Connections, Yahtzee with Buddies, Board Game Arena
- **Wants:** Quick rounds (<5 min), async play with friends, screenshotable moments, gentle progression, no homework
- **Quits if:** Sessions >10 min, pay-to-win, complicated upgrade trees, toxic players, friends leave

### Persona B: "Optimization Oscar"
- **Age:** 27, data analyst, active on Reddit/Discord
- **Bartle Type:** Achiever (primary) / Explorer (secondary)
- **Plays:** 1-2 sessions/day, 30-60+ min. Desktop browser primary
- **Plays:** Balatro, Slay the Spire, Slice & Dice, Board Game Arena (rated)
- **Wants:** Skill > luck over many games, deep crafting that rewards planning, ELO ranking, emergent combos, content depth
- **Quits if:** Meta is "solved" with no rebalancing, pure randomness, no skill gap, too simple to theorycraft

### Persona C: "Weekend Dad Wayne"
- **Age:** 45, high school teacher, plays board games with kids
- **Bartle Type:** Explorer (primary) / Socializer (secondary)
- **Plays:** 2-3x/week, 15-30 min. iPad + laptop browser
- **Plays:** Board Game Arena, Apple Arcade, Catan Universe
- **Wants:** "Aha!" moment in first game, rules explainable in 2 min, 10-15 min games, no account wall (just send a link), satisfying dice feel
- **Quits if:** Tutorial >90 sec, forced to play strangers, content gated behind grinding, inappropriate themes, slow loading

---

## Genre Opportunity Map

### Saturated
- MONOPOLY GO / Coin Master / Dice Dreams (slot machines in board game skin -- 80% of dice genre revenue)
- Pure Yahtzee clones
- Single-player roguelike deckbuilders (post-Balatro flood)
- Gacha/loot-box dice aesthetics

### Underserved
- **Multiplayer dice-crafting in a browser** -- Dice Forge proved it works physically, no digital-native version exists
- **Casual competitive games that aren't puzzles** -- Wordle proved daily habit beats endless content, but all casual browser games are single-player
- **"Craft your luck" as multiplayer mechanic** -- Balatro/Slice & Dice proved players love manipulating randomness, but all single-player
- **Accessible strategy for mixed skill groups** -- BGA has 11M users but most games need existing board game knowledge

### Emerging Trends
- Browser games market projected $9.07B by 2030
- "Balatro effect" -- luck manipulation legitimized as mainstream design space
- Daily/ritual game cadence (Wordle model)
- "Cozy competitive" -- competitive but not stressful

---

## What Makes Dice Feel Thrilling (Design Theory)

### Key Principles

1. **Anticipation > Outcome** -- Dopamine spikes DURING anticipation, not at reward. The moment before dice stop = more exciting than the result. → Dramatic roll animations, slow reveals, tension.

2. **Near-Miss Effect** -- Near misses activate same reward brain circuits as wins (Neuron, 2009). "Almost got it" ≈ "Got it" neurologically. → Show ghost outcomes, "one face away!" feedback, slow-motion near-miss rolls.

3. **Illusion of Control** -- Any personal involvement with random outcome makes people feel more in control (Henslin 1967: craps players throw harder for high numbers). → Dice CRAFTING amplifies this. "I chose these faces, so this is MY roll."

4. **IKEA Effect** -- People value things more when they built them. A die you crafted is worth more emotionally than a default die. → Make modification feel significant and permanent. Dice should feel like YOURS.

5. **Variable Reward Schedules** -- Uncertain rewards more exciting than certain ones. → High-variance payoffs from dice-face combos. Sometimes your crafted die does something INSANE.

6. **Social Amplification** -- A great roll alone = satisfying. A great roll everyone sees = legendary. → Multiplayer IS the primary amplifier. Show opponents' rolls live. Reaction emotes. Shared spectacle.

7. **Escalation** -- Thrilling dice games escalate stakes over time. → Early rounds for crafting, later rounds where crafted dice face ultimate test.

8. **Feedback Juice** -- Visual/audio feedback transforms numbers into emotional events. → Invest heavily in roll presentation. The MOMENT of the roll is the product.

### The Formula
**Player agency BEFORE the roll + dramatic presentation DURING + meaningful choices AFTER = thrilling**

### Randomness Feels BAD When:
- No meaningful input before the roll
- Binary outcomes (win/lose) with no middle ground
- No recovery from bad luck
- Consequences disproportionate to player control
- Game doesn't acknowledge the emotional weight

### Randomness Feels THRILLING When:
- Meaningful choices shaped the probability space
- Multiple outcomes are interesting
- Bad rolls create new decisions, not dead ends
- Presentation amplifies drama
- Other players are watching and reacting

---

## Balatro Lessons (Most Important Reference)

1. **Reframes luck as resource, not obstacle** -- randomness is raw material you shape
2. **Simple systems, emergent complexity** -- simple verbs ("doubles hearts") combine into explosive outcomes
3. **"Stars align" moment** -- when synergies chain and score goes from 300 to 30,000 = core emotional payoff
4. **Borrows gambling psychology ethically** -- dopamine loops serve enjoyment, not extraction
5. **Every run tells a story** -- players name their strategies after combos they found

---

## Art Style Direction

| Style | Example | Pro | Con |
|-------|---------|-----|-----|
| **Clean vector / flat** | Wordle, NYT Games | Fast, scales, timeless | Can feel sterile |
| **Warm illustrated** | Balatro, Luck Be a Landlord | Distinctive, memorable | Slower to produce |
| **Low-poly / geometric** | Monument Valley | Modern, performant | Can feel cold |
| **Cozy cartoon** | Stardew, Slay the Spire | Approachable, wide appeal | Can look generic |
| **Bold graphic / pop art** | Dicey Dungeons, Dice Throne | Strong identity, dice-native | May skew too "gamer" |

**Recommendation:** Warm illustrated dice (tactile, "real" objects) + clean vector UI (menus, scores). Balatro's warmth meets Wordle's clarity. Dice are the stars.

---

## Mechanical References

- **Balatro** → Simple pieces combining into explosive synergies. Dice faces = Jokers.
- **Dice Forge** → Face-swapping should be a moment of anticipation, not a menu.
- **Slice & Dice** → Give players information before they commit. Convert "random" into "puzzle."
- **Luck Be a Landlord** → "Watch it go" moment where crafted dice perform and results cascade.
- **Dice Throne** → Each player's dice should feel different based on crafting choices.
- **King of Tokyo** → Audience effect. Other players watching = every outcome is a spectacle.
- **Wordle** → Daily challenge mode. Same starting conditions = "we all played the same thing today."

## Anti-References

- **MONOPOLY GO / Coin Master** → Slot machines in board game skin. Energy timers, premium currency obfuscation, dark patterns.
- **Yahtzee with Buddies** → Monetization attached to core loop. If spending money = fairer game, trust is broken.
- **Pure dice chuckers** → Games with zero agency. Every roll needs a decision before, during, or after.
- **Overly complex dice games** → Max 3 meaningful choices per turn. Shallow decision tree, deep decision impact.
- **No social sharing hook** → Need a Wordle-style shareable result card.

---

## Sources

- [GameAnalytics -- Bartle Taxonomy](https://www.gameanalytics.com/blog/understanding-your-audience-bartle-player-taxonomy)
- [Devtodev -- Game Market Feb 2025](https://www.devtodev.com/resources/articles/game-market-overview-the-most-important-reports-published-in-february-2025)
- [Browser Games Market 2025](https://www.thebusinessresearchcompany.com/report/browser-games-global-market-report)
- [Board Game Arena 10M Users](https://gamesbeat.com/board-game-arena-surpasses-10m-user-account-milestone/)
- [Magpie Games -- Push Your Luck](https://magpiegames.com/blogs/news/gametech-push-your-luck)
- [Psychology of Games -- Near Miss](https://www.psychologyofgames.com/2016/09/the-near-miss-effect-and-game-rewards/)
- [Game Wisdom -- Balatro Analysis](https://game-wisdom.com/analysis/balatro)
- [Goomba Stomp -- Balatro Addictive](https://goombastomp.com/how-balatro-became-one-of-the-most-addictive-roguelikes/)
- [Dice Forge BGG](https://boardgamegeek.com/boardgame/194594/dice-forge)
- [Thinky Games -- Slice & Dice](https://thinkygames.com/reviews/slice-and-dice-youll-just-keep-rollin/)
- [Pixune -- Game Art Trends 2025](https://pixune.com/blog/game-art-trends/)
- [adjoe -- Casual Gamers](https://adjoe.io/glossary/casual-games-and-casual-gamers/)
