# Phase 9: Multi-Player Display — Design Context

User's design vision captured during 08-02 checkpoint verification.

## Layout Changes

- Scale all dice down slightly so an additional die COULD fit in the row (we're not adding one — just creating breathing room)
- Move locked dice rows to the right so the same gap that currently exists on the right side is preserved
- The freed-up space on the left is where the avatar/profile group lives

## Player Profile Group (left side of each row)

- **Avatar circle**: placeholder for future profile image
- **Below/overlapping the avatar circle**: player info
  - Points (larger text, primary)
  - Starting Dice number (smaller, secondary)
- This pattern applies to both human and AI player rows

## Goal Row Profile Group

- Instead of an avatar circle, use a **Star in a circle** (stars = point icon)
- Positioned to the left of the goal dice, same position as player avatars

## AI Dice Lock Animation (new)

- When AI rolls (behind the scenes) and matches are found:
- Dice lerp FROM the AI profile group TO their locked row slots
- Start at scale 0, scale up along the way to full size at destination
- Communicates "dice emerging from the AI's pool into locked position"

## AI Dice Unlock Animation (new)

- Reverse of lock: dice scale DOWN as they fly in an arc back to the AI profile group
- When they reach scale 0, they disappear (returned to data/pool)

## Round End — Pool Dice Exit Animation

- After the goal is reached by anyone:
- Human's remaining pool dice scale up slightly (pop), then scale down to 0 and disappear
- Clean visual closure for the round

## Round Start — Pool Dice Spawn Animation

- Dice equal to starting dice total lerp FROM the Player Avatar group
- Scale up from 0, overshoot slightly (bounce), scale back to correct size
- WHILE scaling up, they are physically rolling (tumbling animation)
- The roll result doesn't count — it's purely visual ("rolling themselves into existence")
- Future: custom die faces may appear, but number doesn't matter for spawn

## Goal Dice Enter/Exit Rework

- **Exit (current round ending)**: Goal dice translate fast to the RIGHT (no rolling). Quick departure.
- **Enter (new round starting)**: Goal dice come in FROM the Star icon on the LEFT
  - Start at scale 0 at the star position
  - Scale up as they roll into their final positions
  - Rolling animation during movement (similar to pool spawn)

## Summary

The visual language is:
- Things emerge FROM their owner's icon (scale 0 → full, with rolling)
- Things return TO their owner's icon (scale full → 0, arc trajectory)
- Goal dice emerge from the Star (point icon)
- Clean round transitions with pop/despawn and spawn-roll animations
