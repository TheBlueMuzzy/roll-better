# Phase 12 Plan 4: Player Components + Device Verification Summary

**Added responsive scaling to player profiles, fixed layout crowding, added goal score display, and replaced settings gear with text link.**

## Accomplishments
- Viewport-based responsive scaling on PlayerProfileGroup, GoalProfileGroup, and PlayerIcon (scale factor clamped [0.85, 1.3] at 390px baseline)
- Right-aligned profile groups via CSS transform to prevent star-slot overlap
- Reduced profile sizes for tighter footprint (avatar 44px, star 42px, goal circle 48px)
- Shifted slot centering right via getSlotX formula change for avatar room
- Added PROFILE_X_OFFSET constant shared across Scene, App, and gameStore
- Goal star now displays potential score using penalty-based formula
- Main menu: replaced gear icon with "Settings" text link
- How To Play: added prev/next arrow buttons for desktop navigation

## Commits
- `a4cd2a3` — feat(12-04): responsive scaling for PlayerProfileGroup and PlayerIcon (Task 1)
- `d78340a` — feat(12-04): profile layout improvements + goal score + settings menu
- `8718d84` — feat(12-04): add navigation arrows to How To Play slides

## Files Modified
- `src/components/GoalRow.tsx` — PROFILE_X_OFFSET, getSlotX centering (2.5)
- `src/components/PlayerProfileGroup.tsx` — right-aligned, reduced sizes, responsive scale
- `src/components/GoalProfileGroup.tsx` — right-aligned, reduced sizes, potentialScore prop
- `src/components/PlayerIcon.tsx` — responsive viewport scaling on all inline styles
- `src/components/Scene.tsx` — PROFILE_X_OFFSET usage, potentialScore computation
- `src/components/MainMenu.tsx` — Settings text link replaces gear button
- `src/components/HowToPlay.tsx` — navigation arrow buttons
- `src/App.css` — .menu-settings-link styles
- `src/App.tsx` — PROFILE_X_OFFSET import
- `src/store/gameStore.ts` — PROFILE_X_OFFSET import

## Decisions Made
- PROFILE_X_OFFSET = 0.10 (small offset keeps avatars visible while preventing star-slot overlap)
- Right-alignment via `transform: 'translate(-100%, -50%)'` on drei Html elements
- Potential score formula: `max(0, 8 - penalty)` with penalties `[1, 0, 1, 1]` per extra die beyond 8
- Avatar partial clipping on phone viewports is acceptable — art pass will revisit sizing

## Issues Encountered
- Initial right-alignment with PROFILE_X_OFFSET=0.65 pushed avatars completely off-screen; resolved by reducing sizes and offset
- Offset direction was counter-intuitive (larger = further left = more clipping); iterated with Playwright screenshots to find optimal value

## Next Phase Readiness
- Phase 12: Responsive UI complete
- Ready for Phase 13: Audio & Juice
