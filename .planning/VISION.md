# Vision Capture (Temporary Buffer)

Ideas captured during development sessions. Periodically merged into **PRD.md §11** (the master list), then cleared from here.

**Master list**: `.planning/PRD.md` §11 — Future Ideas (#1–#22)

---

### 2026-03-07 — Remove "Ready" button, auto-ready on join
- Get rid of the "ready" button in lobby entirely
- As soon as you type in the room code and hit "start", you're readied automatically
- This fixes the booted-player flow: if you get kicked back to menu (bot takeover, disconnect, etc.), you can rejoin by entering the room code and hitting start
- No dead-end lobby state with a ready button that does nothing
- Context: After bot takeover returns player to menu, lobby shows with ready button but no way to actually rejoin
