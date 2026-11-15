# PRTS layout: HOME and TERMINAL screens

One layout, two screens. `layouts/prts.json` has two sibling nodes under `art`: `home` (tiles over the wallpaper, hidden at launch)
and `term` (96px nav band + terminal filling the rest). A switch is `layout.show` on one and `layout.hide` on the other,
so terminals and mod copies stay alive; the switch is instant (node show/hide is not animatable, only per-element loops are).
Launch screen = TERMINAL (file default). `shared.json`/`.state` may remember a left-open drawer or panel, not the screen.

Keys (`keys.json`, section `layout:prts`, so other layouts are untouched): `cmd-.` = `prts.toggle`.
Other mod commands usable as `prts.<name>` or `herdr-app do prts.<name>`: `home`, `term`, `squads`, `roster`, `missions`, `base`.

HOME tile -> TERMINAL screen with: 終端 = just the terminal, 編隊 = spaces drawer, 幹員 = agents drawer (grouped), 調度 / 任務 = agents drawer (priority sort),
基建 = Changes panel, 倉庫 = terminal picker. The drawer (`drawer` node, 340px, left of the terminal) and the right panel (`panel`, Files/Changes, the one the tab bar drives)
are hidden by default. Nav nodes toggle the same things; the blue node = what is open. Back arrow closes the open drawer/panel, else goes HOME.
Note: 幹員 / 任務 set the shared `agents.sort` (grouped / priority), which the shipped `agents` mod reads too.
Floating `lastop` ("前往上一次作戰") appears bottom-right only while another agent is blocked or done; click focuses it.
HOME VOICE card = the most urgent agent (blocked > done > working > idle, newest first): space name + terminal title; dim when no agent exists.

Switch: `herdr-app do layout.switch '{"name":"prts"}'` (ctrl-shift-l cycles). Back: `... '{"name":"main"}'`.

Parts: `mods/prts` (roles top, hero, menu, voice, spacer, footer, nav, lastop; flat square slabs, SVG line art/grain/stripes/badge shapes in the same folder, Hiragino Sans W8 for titles), `mods/prts-spaces` (編隊 list) and
`mods/prts-agents` (幹員 / 任務 list), both opened as dialogs from the tiles. Their `label.js` is
duplicated because mods cannot import across folders. Texture and motion are native
`.loop` only (halftone dots, particles, status-dot breathing); the only timer is the clock, once a minute.

## Background art

`layouts/prts.json`, node `art`: `"background": { "image": "backgrounds/prts-operator.jpg", "fit": "cover" }`.
The root keeps a dark gradient under it, so a missing file shows the gradient and nothing breaks.

Measured in this app (layout background and `image()` in a mod, 3-frame test files):

| Format | Result |
|---|---|
| GIF, animated WebP | loads, shows the first frame only, never advances |
| MP4, WebM | not loaded (no background, no error) |
| PNG, JPEG, static WebP | fine |

So nothing animates as a background. The art is a still; all motion comes from the panels.
Animated files are still accepted (frame 1 is shown), but a 200-frame 1920x1200 WebP is 30+ MB for
one frame, so extract a still. Recommended: 16:10, at least 2400x1500 (the window is 3360x2100 physical
at full screen; `cover` crops the overflow). Keep the figure left of centre and the right 27% quiet,
that is where the tile menu sits.

```sh
# first frame of a clip (mp4, webm, animated webp/gif) as a 16:10 still
ffmpeg -i clip.mp4 -frames:v 1 -vf "scale=2400:1500:force_original_aspect_ratio=increase,crop=2400:1500" backgrounds/prts-operator.png
```

Caveat: the app caches a background image by path for as long as it runs, including a failed load.
After first adding the file, or replacing a file under the same name, restart Herdr, or give the file a
new name and change that one line (a new path loads at once).

## What the numbers are

The API exposes no context usage or token counts, so nothing is mapped to them.
- 理智 `n/max`: agents that are not blocked / all agents (drops when an agent needs you).
- 龍門幣: sum of the `turn` counters of every live agent terminal (`terminals()`).
- 終端 (was 作戰): `<active tab>`, dot = that tab's agent status (breathes faster when working or blocked);
  click focuses the tab's terminal.
- 調度 (tan slab) = agents blocked (等待) and done (完成); red clock badge shows when something is blocked.
- 倉庫 (dark slab) = number of core terminals. Orange diamonds blink on 編隊/幹員/調度 when an agent is blocked or done. 基建 tan badge = tabs in the active space. 任務 grid lights one cell per working agent.
- 編隊 = number of spaces, click opens the list. 幹員 = number of agents, click opens the list.
- 基建 = git branch of the active tab's terminal (`-` when it is not in a repo), click opens Files.
- 任務 = agents currently working, click opens the agent list.
- Yellow appears only for a blocked agent ("needs you"); everything else is white, gray and ice blue.
