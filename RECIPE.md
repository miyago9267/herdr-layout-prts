# PRTS

A Herdr layout styled after a tactical-game operator terminal: a HOME screen of flat, square, frosted-white tiles that summarize your spaces and agents, and a TERMINAL screen where one large translucent terminal fills the window. A node map drops down from the house button to jump between the two and open the side lists. Dark background, One Dark terminal colors, ice-blue accent.

![PRTS](preview.png)

## What you see

**TERMINAL** (shown at launch)
- Top bar, 48px, `#04070bd2`: back arrow (36px square) and house button (84x36, white 1px border) at left; command palette and settings squares at right. The bar drags the window.
- Below it, 8px/10px padding: one square console (radius 0, `#0b0f1552`, 1px `#ffffff33`, no shadow) holding a 22px title strip (`作戰終端 // <tab name>`, diamond, ice-blue corner brackets), the `prts-tabs` bar (40px: dark strip, flat slabs, selected tab paper-white `#ecebe7f0` with dark heavy text and a 3px left edge, agent status as diamonds: blocked orange blinking, done green, working blue), a 10px bracket foot, and the active tab's square panes (`terminal_opacity` 0.45, pane header on hover). Behind the console the wallpaper is dimmed by a top-to-bottom dark gradient (`#03060ac4` to `#05080e8c`).
- Hidden until opened: a 340px drawer at left (spaces list or agents list) and a 368px right panel (shipped `files` / `changes`).
- Stage screen, opened by the house button or `cmd-;`: a window overlay covering everything under the 48px bar (full width, to the bottom of the window), `#05080ef0`, after the game's stage select. Left, ATTENTION: one big 124px card per space that has a blocked or working agent (blocked first, at most 5): a 116px dark strip (squad icon, SQUAD caption, `n/m WORKING` and a 3px progress line) beside a paper slab (`#ecebe7f0`) with the space name in Hiragino W8 32px, a mono line `n AGENTS · TAB`, a yellow (`#e8c21a`) pill 需介入 / 運行中 with the agent's title, a 3px left edge (red blocked, blue working) and a blinking diamond. Right, a 400px TO-DO LIST: 62px slabs for `done` then `idle` agents (at most 6): dark icon square, small grey mono space name, 18px title (agent title or tab), yellow pill 已完成 / 待命. Under it a 前往上一次作戰 slab (dark 22px strip over a paper slab) for the most urgent other blocked or done agent. Empty columns show a dim line. Bottom, an 88px icon bar (`#0b0e12f2`, 1px top line): 終端 / 編隊 / 幹員 / 基建 / 任務 / 首頁 with the line-art icons, the current one (終端) larger with a small white triangle above it, the open drawer or panel in ice blue, a diamond on 幹員 when an agent is blocked or done. Caption `PRTS // STAGE` in 10px mono bottom-right.
- Floating card bottom-right, 230px, only while another agent is blocked or done: dark 22px strip "前往上一次作戰" over a paper slab with the space name and 需介入 / 已完成.

**HOME**
- 64px top strip: search / notes / settings icons at left; date, clock and two counters (理智 n/max, 龍門幣) at right.
- Right column 734px of flat square slabs, paper `#ecebe7f0` with a dark edge, Hiragino Sans W8 titles:
- Fake perspective, after the game's slanted tile group (Herdr cannot rotate or skew live UI): each slab has a slanted SVG plate behind it (`tilt.js`, `#a9cde6`): a bright 4px top edge rising to the right, a translucent wedge past the right side, a thin drop along the bottom, the right side up to 12px taller. Tiles further right sit lower (幹員 11px, 基建 6px, 倉庫 12px) and rows are 10px apart. Text stays straight; clicks and counts are unchanged.
  - 終端 (wide): working agents count, 運行 / total, active tab, status dot.
  - 編隊 (spaces count) and 幹員 (agents count), side by side, with line-art icons.
  - 調度 (tan `#b88a50f2`): 等待 (blocked) and 完成 (done) counts, red clock badge when something is blocked.
  - 任務, 基建 (git branch of the active terminal), 倉庫 (dark slab, terminal count).
- Bottom-left VOICE card (520x108): the most urgent agent's space and title; dim line when no agent reports.
- Footer, 20px: `RHODES ISLAND // PRTS · PRIMITIVE RHODES ISLAND TERMINAL SERVICE`.
- Background: root gradient `#0b1016` → `#12202c` at 135°, plus an optional still image on node `art`.

## How it behaves

- Agent status: blocked = orange diamonds blink on 編隊 / 幹員 / 調度, red clock badge on 調度, the stage screen's 幹員 icon gets a diamond, the floating card says 需介入. Done = 完成 count and the card says 已完成. Working = 終端 count, one lit cell per working agent on 任務. Idle = counted, nothing lights.
- Screen switches: a transition card covers the switch, since layout nodes can't animate: `#1a1c1f` at 92% fades in over 120ms, holds, fades out over 250ms (closed by 800ms). Emblem (220px) at the centre, 1px white lines growing in from the left edge with 10px square nodes, a 5x4 dot grid and a 1px vertical line with a 22px yellow (`#e8c21a`) square on the right, and a random tip in white near the bottom. Drawn in `overlays.js`. The stage screen fades in (220ms) and out (180ms); the boot splash fades in (350ms).
- `cmd-.` toggles HOME / TERMINAL. `cmd-;` or the house button opens the stage screen; Esc (the overlay takes the keyboard while open), a click on its empty space, the house button / `cmd-;` again, or picking something closes it. Clicking an ATTENTION card or TO-DO slab selects its space and focuses that agent's pane; the icon bar does what the old nodes did.
- Tiles and icon-bar items: 終端 → TERMINAL; 編隊 → spaces drawer; 幹員 → agents drawer (grouped); 調度 / 任務 → agents drawer (priority sort); 基建 → Changes panel; 倉庫 → terminal picker; 首頁 → HOME. The icon for whatever is open is ice blue.
- Back arrow closes the open drawer or panel, else goes HOME.
- Launch (about 5.3s, once per app run, click skips): a full-window dark screen `#141619` with a 64px footer strip. First a yellow (`#e8c21a`) wireframe geodesic sphere, 440px, turning slowly, around a 130x200 outlined card (服務器 / 泰拉 / #0), caption 正在嘗試與 Rhodes Island 取得神經連接, while a 2px yellow line grows from the left edge to the sphere over 3s with a percent counter. At 3.3s it cross-fades to the emblem (300px) on a thin horizontal rule with a 5x4 dot grid to its right and a random usage tip near the bottom; it fades out from 4.8s.
- When an agent turns `done` (finished while you weren't looking), a window over the whole app with a 320px banner at its vertical centre (a click anywhere dismisses it): a translucent band (`#111111d9`, 180px) opens from the middle in 280ms; the emblem (300px) sits just left of centre and breaks out of the band; to its right 任務 / 完成 (Hiragino W8, 110px, two lines) with small MISSION / ACCOMPLISHED (34px Avenir Next heavy) beside it, inside four thin 2px corner brackets; the agent's space and title in 11px mono at the band's bottom-right. It fades at 3.9s; a click focuses that agent. Drawn in `overlays.js`.
- Notifications (every `notify()` and Herdr's own toasts, e.g. an agent finishing) are drawn by `mods/prts-toast` in the 前往上一次作戰 card style: a 22px dark strip with a blinking diamond and the kind (警報 / 注意 / 行動完成 / PRTS 通知, red / orange / green / blue by level) over a paper slab with a 3px colored left edge, title (Hiragino 15px) and body. They slide in from the right (60px, 260ms) and fade in; click runs the toast's action. The floating 前往上一次作戰 card slides in the same way whenever its agent or state changes.
- Neither takes the keyboard (they are `window` overlays), so typing continues underneath.
- Motion is native `.loop` / `.transition`: halftone dots, drifting particles, breathing status dots and rings. The only timer is the clock, once a minute.

## Built from

- `layouts/prts.json`: root column (theme `prts`, no title bar, traffic lights at 14,12) → `art` column (background image) → two siblings `home` and `term`. Switching screens is `layout.show` / `layout.hide` on them, so terminals and mod copies stay alive. `term` = `nav` block + `work-body` row (`drawer` stack of `d-spaces` / `d-agents`, `console` column with `strip`, `tabs`, `main` tab block and `foot`, `panel` stack of `files` / `changes`), floating `lastop`.
- `mods/prts`: one mod, drawn by `props().role`: `top`, `hero`, `menu`, `voice`, `spacer`, `footer`, `nav`, `navpop`, `lastop`. The stage screen is `openOverlay({kind: "window", frame: "none", width: 1, height: 0.955, at: {x: 0, y: 48}, props: {role: "navpop"}})` (a popup is clamped to about 60% of the window height, a window is not; since a window neither closes on Esc nor on an outside click, the mod focuses itself with `cx.focus_handle()` and handles Esc and a click itself). Its view is `mods/prts/stage.js` (`stage({on, nodes, close, pick, focus})`, reads `agents()` / `spaces()`). Commands for `keys.json`: `prts.toggle`, `prts.nav`, `prts.home`, `prts.term`, `prts.squads`, `prts.roster`, `prts.missions`, `prts.base`, `prts.boot` (replay the splash), `prts.mission` (preview the banner). Roles `boot` and `mission` are `openOverlay({kind: "window", frame: "none"})`; the `nav` copy opens `boot` from `init` once (flag on `globalThis`), and `top` / `nav` call a status watcher from `render` that keeps the last status per agent address on `globalThis`, so the two screens fire one banner.
- `mods/prts-spaces`, `mods/prts-agents`: clones of the shipped `spaces` and `agents` mods, restyled for the drawer as game-style squad / operator lists: dark 26px strip header (`編隊 // SQUAD`, `幹員 // OPERATOR`) with a diamond, small mono group labels with a thin rule, and flat square slabs per row (paper-white active row with heavy Hiragino name and a 3px colored left edge, dark translucent slabs for the rest). Status is a diamond: blocked orange blinking, done green, working blue pulse, idle none. Branch / ahead-behind stay as small mono text.
- `mods/prts-toast`: the toast renderer, chosen by the layout root's `"toast": "prts-toast"`.
- `mods/prts-tabs`: a copy of Herdr's shipped `tabs` restyled; roles by `props.role`: none = tab bar, `strip` = title strip, `foot` = bracket strip. Same behavior as `tabs` (select, close, rename, drag, + menu, Files / Changes).
- Shipped mods used as is: `pane`, `files`, `changes`, `picker`.
- `herdr` API: `spaces`, `agents`, `panes`, `terminals`, `layout`, `shared` / `setShared` (`agents.sort`), `run`, `openOverlay` / `closeOverlay`, `nextCommand`.
- Emblem: `mods/prts/emblem.svg`, an original triangle with a diamond mark and a PRTS wordmark. If `backgrounds/prts-emblem.png` exists in the Herdr home (checked with `fs.stat` when the splash or banner opens), that image is used instead, so a person can supply their own emblem locally without it being part of the layout.
- `mods/prts/geo.svg`: the wireframe sphere, generated (subdivided icosahedron, depth-shaded edges).
- Art: SVG masks in `mods/prts` (line-art icons, grain, stripes, dots, the white triangle `tri.svg`), all drawn for this layout. No game assets. The HOME tilt plates are pixel-exact `slant-<w>x<h>.svg` files (one per tile size, listed in `tilt.js`).
- `themes/prts.json`: dark panels, One Dark ANSI colors, accent `#4fc3f7`.

## Watch out

- MISSION ACCOMPLISHED uses Avenir Next (macOS); set `HEAVY` elsewhere.
- Titles use Hiragino Sans W8, a macOS system font. On other systems set `ZH` at the top of `mods/prts/main.js` to an installed heavy CJK face, or titles fall back.
- Herdr shows only the first frame of animated images, and video is not supported as a background. Put a still at `backgrounds/prts-operator.jpg` (16:10, 2400x1500 or larger, subject left of centre; the right 27% sits under the tiles). Without it the gradient shows.
- Herdr caches a background by path while it runs: after adding or replacing the file, restart Herdr or rename the file and the path.
- 幹員 / 任務 set the shared `agents.sort`, which the shipped `agents` mod also reads.
- `label.js` is duplicated in both list mods because mods cannot import across folders.
- If you install by symlinking the mod folders, Herdr does not hot-reload them: switch layouts (or restart) after editing.
- The HOME right column is a fixed 734px; very narrow windows clip the tiles. The tilt plates assume the 734px column (tile sizes 734x240, 364x168, 287x168, 255x168, 687x162, 180x168); resize a tile and its plate needs a matching `slant-<w>x<h>.svg`, else that tile just has no plate.

## Done when

- `herdr-app check` passes for `mods/prts`, `mods/prts-spaces`, `mods/prts-agents`, `mods/prts-toast`, `mods/prts-tabs`.
- `herdr-app do prts.toast` shows a 行動完成 card sliding in at the bottom right.
- `herdr-app do layout.switch '{"name":"prts"}'` shows the TERMINAL screen with a working terminal.
- `cmd-.` flips to HOME and back; the tiles show real counts of spaces, agents and terminals.
- `cmd-;` opens the stage screen; clicking 編隊 in its icon bar opens the spaces drawer and turns the icon ice blue; Esc closes it.
- `herdr-app do prts.boot` and `herdr-app do prts.mission` show the splash and the banner, and typing in the terminal still works while they are up.
- An agent that reports `blocked` makes the diamonds blink and the floating card appear.
- The TERMINAL screen shows square slab tabs (selected one paper-white), the `作戰終端 //` strip with corner brackets, and a dimmed wallpaper; a blocked agent's tab diamond blinks orange.
