# IARC Self-Assessment — Roll Better

**Date:** 2026-03-05
**Purpose:** Internal documentation of content rating rationale for Roll Better. This is not a formal submission — it serves as a reference for completing IARC questionnaires during app store submissions (Google Play, etc.).

---

## Content Categories

### Violence
**None.** Roll Better is an abstract dice-rolling game. No characters, creatures, or entities are depicted or harmed. The only interaction is rolling and locking dice.

### Fear
**None.** No horror elements, jump scares, threatening imagery, or dark/disturbing content of any kind.

### Sexuality
**None.** No sexual content, nudity, or suggestive material.

### Language
**None.** The game contains no chat functionality and no user-generated content. All text is developer-written UI labels and game instructions.

### Drugs / Alcohol / Tobacco
**None.** No references to or depictions of controlled substances.

### Gambling
**No real-money gambling.** Dice rolling is a core game mechanic (similar to Yahtzee), not simulated gambling. There is:
- No betting of any kind
- No virtual currency wagered
- No real-money transactions
- No loot boxes or randomized purchases
- The dice mechanic is purely strategic — players choose which dice to lock toward scoring goals

### User Interaction
**Online multiplayer via temporary room codes.** Specifics:
- No text chat, voice chat, or any form of player-to-player communication
- No friend lists, profiles, or persistent player identity
- No user-generated content sharing
- Room codes are randomly generated 4-letter codes, valid only for the duration of a single game session
- No ability to share personal information through the game

### Data Collection
**None.** Specifics:
- No user accounts or registration
- No cookies, analytics, or tracking
- No personal data collected, processed, or stored
- sessionStorage client ID is ephemeral (cleared on tab close)
- No server-side logging of player activity
- See `public/privacy.html` for the full privacy policy

### In-App Purchases
**None.** Roll Better is completely free with no monetization:
- No in-app purchases
- No subscriptions
- No advertisements
- No premium features or paywalls

---

## Recommended Rating

| Rating System | Recommended Rating | Rationale |
|---|---|---|
| **IARC** | **3+** | No objectionable content in any category |
| **ESRB** | **Everyone (E)** | Abstract dice game, no violence/language/etc. |
| **PEGI** | **3** | No content requiring a higher rating |
| **USK** | **0** | Suitable for all ages |
| **ClassInd** | **L (Livre)** | Free for all audiences |

### Notes
- The game's online multiplayer component does not warrant a higher rating because there is no communication mechanism between players — they can only see game state (dice values, scores).
- Dice rolling as a game mechanic is universally recognized as non-gambling when no real or virtual currency is wagered (precedent: Yahtzee, Farkle, board game apps).
- For Google Play Store or similar distribution, the IARC questionnaire would be completed during the submission process. This document serves as a pre-filled reference for those answers.
