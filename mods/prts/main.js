// PRTS, two screens in one layout (layouts/prts.json): HOME (tiles over the wallpaper) and TERMINAL (slim top bar + big terminal, node map in a popup).
// One mod, roles picked by props.role:
//   top     HOME resource strip (plain numbers, date line, three icon buttons)
//   hero    HOME transparent stage over the background art, with a few drifting particles
//   menu    HOME flat-slab tile cluster (終端 / 編隊 / 幹員 / 調度 / 任務 / 基建 / 倉庫); every tile jumps into the TERMINAL screen
//   voice   HOME left-bottom card: the most urgent / latest agent report
//   footer  HOME dim caption line
//   spacer  empty, lets the art show
//   nav     TERMINAL 48px top bar: back / house buttons, search / settings; house (or cmd-;) opens navpop
//   navpop  overlay popup under the bar: node map (首頁 編隊 幹員 終端 基建 任務)
//   lastop  TERMINAL floating card "前往上一次作戰": only while another agent is blocked or done
// A screen switch shows one layout node and hides the other (nodes `home` / `term`), so terminals and mod copies stay alive.
// Hard corners, flat fills, no blur shadows: depth is a darker backing slab that a hovered tile slides off.
// Line art, grain, stripes and badge shapes are SVG masks in this folder; fonts are installed ones only.

import { View, div, svg } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { spaces, agents, panes, terminals, theme, run, window, layout, shared, setShared, nextCommand, props, openOverlay, closeOverlay } from "herdr";

const MONO = "Geist Mono";
const NUM = "Geist";
const ZH = "Hiragino Sans W8"; // heavy installed CJK face with full Traditional coverage (macOS system font)
const WHITE = "#f4f7fa";
const INK = "#14171b";
const GRAY = "#868d96";
const PAPER = "#ecebe7f0";
const PAPER_HOVER = "#f6f5f1f6";
const PAPER_EDGE = "#6c7076e6";
const LINE_ART = "#b2b7be";
const TAN = "#b88a50f2";
const TAN_HOVER = "#c79a5df5";
const TAN_EDGE = "#5e3f1ce6";
const TAN_DARK = "#9c7240";
const CHAR = "#1a1d21f2";
const CHAR_EDGE = "#050607";
const GREEN = "#86b22d";
const RED = "#e2292e";
const ORANGE = "#f0801f";
const GOLD = "#d4b06a";
const ACCENT = "#4fc3f7";
const K = 1.5; // HOME tiles are designed at 486px wide; the right column is 734px
const S = (n) => Math.round(n * K);
const pad = (n) => String(n).padStart(2, "0");

const PARTICLES = [
  [0.08, 0.7, 26000, 150, 5200], [0.21, 0.35, 31000, 110, 6100], [0.37, 0.85, 23000, 170, 4700],
  [0.52, 0.5, 34000, 130, 7000], [0.66, 0.78, 28000, 160, 5600], [0.8, 0.3, 36000, 100, 6600],
  [0.92, 0.62, 25000, 140, 5000],
];

const STATUS = {
  working: { label: "WORKING", period: 1400 },
  blocked: { label: "NEEDS YOU", period: 900 },
  done: { label: "DONE", period: 3200 },
  idle: { label: "STANDBY", period: 4200 },
};
const RANK = { blocked: 4, done: 3, working: 2, idle: 1 };

function find(node, id) {
  if (node?.id === id) return node;
  for (const c of node?.children ?? []) { const f = find(c, id); if (f) return f; }
  return null;
}

function activeTab() {
  const s = spaces().find((x) => x.active);
  return { space: s, tab: s?.tabs.find((x) => x.active) };
}

function startHere() {
  const { tab } = activeTab();
  const pane = panes().find((p) => p.tab === tab?.id && p.terminal);
  if (pane) run("pane.focus", { pane: pane.pane });
}

// ---- screens -------------------------------------------------------------------------------------------------------

const isHome = () => !find(layout(), "home")?.hidden;

function go(to) {
  if (to === "home") { run("layout.show", { id: "home" }); run("layout.hide", { id: "term" }); return; }
  run("layout.show", { id: "term" }); run("layout.hide", { id: "home" });
  startHere();
}

// The key command can reach the HOME and the TERMINAL copy at once during a switch: act once.
function toggle() {
  const now = Date.now();
  if (now - (globalThis.__prtsAt ?? 0) < 300) return;
  globalThis.__prtsAt = now;
  go(isHome() ? "term" : "home");
}

// Left drawer (spaces / agents lists). Same node + same view again closes it.
function drawerTo(child, sort) {
  const d = find(layout(), "drawer"), b = find(layout(), "drawer-body");
  if (d && !d.hidden && b?.active === child && (!sort || shared("agents.sort") === sort)) { run("layout.hide", { id: "drawer" }); return; }
  if (sort) setShared("agents.sort", sort);
  run("layout.select", { stack: "drawer-body", child });
  run("layout.show", { id: "drawer" });
}

// Right panel (Files / Changes), the same one the tab bar buttons drive.
function panelTo(child) {
  const p = find(layout(), "panel"), b = find(layout(), "panel-body");
  if (p && !p.hidden && b?.active === child) { run("layout.hide", { id: "panel" }); return; }
  run("layout.select", { stack: "panel-body", child });
  run("layout.show", { id: "panel" });
}

function closeSide() {
  const d = find(layout(), "drawer"), p = find(layout(), "panel");
  if (d && !d.hidden) run("layout.hide", { id: "drawer" });
  if (p && !p.hidden) run("layout.hide", { id: "panel" });
}

// From HOME: enter the TERMINAL screen with a list or panel already open.
const enter = (fn) => () => { go("term"); if (fn) fn(); };
const ROSTER = () => drawerTo("d-agents", "grouped");
const MISSIONS = () => drawerTo("d-agents", "priority");
const SQUADS = () => drawerTo("d-spaces");
const BASE = () => panelTo("changes");
const DEPOT = () => run("mod.open", { name: "picker" });

// TERMINAL node-map popup: an overlay opened by the house button / prts.nav, closed by Esc, a click outside, or a node.
const BAR = 48;
const NAV_H = 300, NAV_LINE = 152, NODE_W = 150;
function closeNav() {
  const id = globalThis.__prtsNav;
  globalThis.__prtsNav = null;
  if (id) { try { closeOverlay(id); } catch (_e) { /* already closed */ } }
}
function toggleNav() {
  const now = Date.now();
  if (now - (globalThis.__prtsNavAt ?? 0) < 300) return;
  globalThis.__prtsNavAt = now;
  if (globalThis.__prtsNav) { closeNav(); return; }
  globalThis.__prtsNav = openOverlay({ mod: "prts", kind: "popup", frame: "none", width: 1, height: NAV_H, at: { x: 0, y: BAR }, props: { role: "navpop" } });
}

// Key commands ("prts.<name>" in keys.json): toggle, nav, home, term, squads, roster, missions, base.
function command(c) {
  const jump = { squads: SQUADS, roster: ROSTER, missions: MISSIONS, base: BASE };
  if (c === "toggle") toggle();
  else if (c === "nav") toggleNav();
  else if (c === "home" || c === "term") go(c);
  else if (jump[c]) enter(jump[c])();
}

// Most urgent agent first, newest among equals.
function topAgent(list, skipFocused = false) {
  return [...list].filter((a) => !(skipFocused && a.focused))
    .sort((x, y) => (RANK[y.status] ?? 0) - (RANK[x.status] ?? 0) || y.seq - x.seq)[0];
}

const clean = (s) => (s ?? "").replace(/^[^\p{L}\p{N}]+/u, "").trim();

// ---- pieces --------------------------------------------------------------------------------------------------------

// Heavy CJK title with the letter spacing pulled in: one fixed, narrower box per character.
function title(text, size, color, step = 0.9) {
  return h_flex().flex_none().children([...text].map((c) =>
    div().flex_none().w(Math.round(size * step)).h(Math.round(size * 1.12)).font_family(ZH).text_size(size).text_color(color).child(c)));
}

function micro(text, color = GRAY, size = 9) {
  return div().font_family(MONO).text_size(size).text_color(color).child(text.toUpperCase());
}

// Badge: flat rectangle with an arrow-cut right edge.
function tag(color, ...kids) {
  return h_flex().flex_none().items_center()
    .child(h_flex().h(S(22)).px(8).gap(5).items_center().bg(color).text_color("#ffffff").children(kids))
    .child(svg("mods/prts/badge-tip.svg").w(8).h(S(22)).text_color(color));
}

function clockGlyph() {
  return svg("mods/prts/clock.svg").size(14).text_color("#ffffff");
}

function diamond(show, right, top) {
  if (!show) return null;
  return div().absolute().right(right).top(top).size(18)
    .child(svg("mods/prts/diamond.svg").size(18).text_color(ORANGE).loop("opacity", { from: 0.5, to: 1, period: 1500 }));
}

export default class Prts extends View {
  init(_p, cx) {
    const role = props()?.role;
    this.now = new Date();
    this.size = { width: 900, height: 400 };
    cx.timer.every(60000, (cx) => { this.now = new Date(); cx.notify(); });
    // One listener per screen: the HOME strip and the TERMINAL nav band take the toggle key.
    if (role === "top" || role === "nav") {
      cx.spawn(async (cx) => {
        for (;;) { const c = await nextCommand(); command(c); cx.notify(); }
      });
    }
  }

  iconButton(id, icon, tip, action) {
    return div().id(id).size(26).flex_none().flex().items_center().justify_center().text_color(WHITE)
      .hover((s) => s.text_color(ORANGE))
      .on_mouse_down("left", (_e, cx) => cx.stop_propagation()).on_click(action).tooltip(tip)
      .child(svg(`mods/workspace-chrome/${icon}.svg`).size(20));
  }

  resource(icon, tint, value) {
    return h_flex().items_center().gap(7)
      .child(svg(`mods/prts/${icon}.svg`).size(24).text_color(tint))
      .child(div().font_family(NUM).font_extrabold().text_size(24).text_color(WHITE).child(value));
  }

  // ---- HOME ----------------------------------------------------------------------------------------------------------

  top() {
    const d = this.now;
    const list = agents();
    const calm = list.filter((a) => a.status !== "blocked").length;
    const coins = terminals().filter((x) => x.status).reduce((n, x) => n + (Number(x.turn) || 0), 0);
    const mac = window()?.platform === "macos" && !window()?.fullscreen;
    const stamp = `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    return h_flex().size_full().items_center().gap(8).px(4).pl(mac ? 76 : 4)
      .child(this.iconButton("palette", "search", "Command palette", () => run("app.palette")))
      .child(this.iconButton("help", "file-text", "Help", () => run("app.help")))
      .child(this.iconButton("settings", "settings", "Settings", () => run("app.settings")))
      .child(div().flex_1())
      .child(v_flex().flex_none().gap(0).px(12).pt(3).pb(2).bg("#0b0f1560")
        .child(h_flex().items_center().justify_end().gap(6)
          .child(svg("mods/prts/ico-battery.svg").w(16).h(9).text_color("#ffffffaa"))
          .child(div().font_family(MONO).text_size(12).text_color("#dfe5ec").child(stamp)))
        .child(h_flex().items_center().gap(26)
          .child(this.resource("ico-sanity", "#ff6b6e", `${calm}/${list.length}`))
          .child(this.resource("ico-coin", GOLD, coins.toLocaleString("en-US"))))
        .child(div().h(1).w_full().mt(2).bg("#ffffffcc")));
  }

  hero(t) {
    const { width, height } = this.size;
    return div().id("hero").relative().size_full().overflow_hidden()
      .on_size_change((size, cx) => {
        if (Math.abs(size.width - this.size.width) > 2 || Math.abs(size.height - this.size.height) > 2) { this.size = size; cx.notify(); }
      })
      .children(PARTICLES.map(([x, y, drift, rise, glow], i) =>
        div().absolute().left(Math.round(x * width)).top(Math.round(y * height)).size(6)
          .loop("top", { from: Math.round(y * height), to: Math.round(y * height) - rise, period: drift, easing: "linear" })
          .child(svg("mods/prts/particle.svg").size(6).text_color(i % 3 === 0 ? "#ffffffaa" : t.accent + "99")
            .loop("opacity", { from: 0.08, to: 0.7, period: glow }))));
  }

  // VOICE: what the most urgent agent last said, in plain words. Dim when there is no agent.
  voice() {
    const a = topAgent(agents());
    const LINE = { blocked: "需要你回應", done: "已完成，等你查看", working: "正在運行", idle: "待命中" };
    const COLOR = { blocked: RED, done: GREEN, working: "#1d8fd0", idle: "#6f7b88" };
    const mood = a ? a.status : null;
    const body = h_flex().relative().size_full().items_center().px(22)
      .child(v_flex().flex_1().min_w(0).gap(6)
        .child(div().font_family(ZH).text_size(19).text_color(a ? WHITE : "#ffffff66").truncate()
          .child(a ? `${a.space_name || "-"}　${LINE[mood] ?? ""}` : "— 目前沒有任何幹員回報 —"))
        .child(div().font_family(MONO).text_size(11).text_color("#ffffff88").truncate().child(a ? clean(a.title) || a.program?.name || a.address : "")));
    return div().id("voice").relative().size_full().bg(a ? "#14171bdc" : "#14171b88").cursor_pointer()
      .hover((s) => s.bg("#1d2126ea"))
      .on_click(() => { go("term"); if (a) run("pane.focus", { pane: a.pane }); })
      .child(div().absolute().left(0).top(0).bottom(0).w(4).bg(a ? COLOR[mood] : "#3a4048"))
      .child(h_flex().absolute().left(4).top(0).h(20).px(8).gap(5).items_center().bg(a ? GOLD : "#6f7b88")
        .child(svg("mods/prts/diamond.svg").size(9).text_color(INK))
        .child(div().font_family(MONO).font_bold().text_size(11).text_color(INK).child("VOICE")))
      .child(div().absolute().left(0).top(14).right(0).bottom(0).child(body));
  }

  // A slab = darker backing + flat face. Hover slides the face 4px left and exposes more of the backing.
  slab(id, { bg, bgHover, edge, action, body, marks = [] }) {
    return div().relative().flex_none()
      .child(div().absolute().left(0).top(0).right(0).bottom(0).bg(edge))
      .child(div().id(id).absolute().left(0).top(0).right(4).bottom(4).overflow_hidden().bg(bg).cursor_pointer()
        .hover((s) => s.bg(bgHover).left(-4).right(8)).on_click(action)
        .child(svg("mods/prts/grain.svg").absolute().left(0).top(0).w(720).h(220).text_color(bg === TAN ? "#00000020" : "#00000018"))
        .children(body))
      .children(marks.filter(Boolean));
  }

  paper(id, o) {
    return this.slab(id, { bg: PAPER, bgHover: PAPER_HOVER, edge: PAPER_EDGE, ...o });
  }

  // Standard off-white tile: title, line art, a real number and a short flavor line.
  plain(id, { zh, en, value, art, action, marks, mono = false, w, mt }) {
    const el = this.paper(id, {
      action, marks,
      body: [
        svg("mods/prts/lines.svg").absolute().left(S(96)).top(S(16)).w(S(120)).h(S(26)).text_color("#00000014"),
        art,
        div().absolute().left(S(14)).top(S(8)).child(title(zh, S(38), INK)),
        h_flex().absolute().left(S(16)).bottom(S(9)).items_baseline().gap(8)
          .child(div().font_family(mono ? MONO : NUM).font_extrabold().text_size(mono ? S(14) : S(22)).text_color(INK).max_w(mono ? S(90) : S(60)).truncate().child(value))
          .child(micro(en)),
      ],
    });
    return w ? el.w(w).h(S(112)).mt(mt ?? 0) : el.flex_1().h(S(112)).mt(mt ?? 0);
  }

  battle(tab, space, working, total, st, color) {
    const label = tab?.name ?? "-";
    return this.paper("t-start", {
      action: enter(startHere),
      body: [
        svg("mods/prts/lines.svg").absolute().left(S(250)).top(S(36)).w(S(150)).h(S(31)).text_color("#0000000f"),
        div().absolute().left(S(14)).top(S(14)).w(S(164)).h(S(100)).bg(INK)
          .child(svg("mods/prts/icon-maze.svg").absolute().left(S(8)).top(S(4)).size(S(92)).text_color("#c9a45aaa"))
          .child(div().absolute().right(S(10)).top(S(6)).font_family(NUM).font_black().text_size(S(78)).text_color("#ffffff").child(String(working))),
        h_flex().absolute().left(S(14)).top(S(118)).w(S(164)).h(S(26)).bg("#0e1013").px(10).items_center().justify_end().gap(4)
          .child(div().font_family(ZH).text_size(S(13)).text_color("#ffffff").child("運行"))
          .child(div().font_family(NUM).font_semibold().text_size(S(13)).text_color("#ffffff").child(`/${total}`)),
        div().absolute().left(S(198)).top(S(12)).child(title("終端", S(66), INK, 0.9)),
        h_flex().absolute().left(S(198)).top(S(98)).items_center().gap(10)
          .child(tag(GREEN, div().font_family(ZH).text_size(S(13)).text_color("#ffffff").child("當前"))
            .loop("opacity", { from: 0.78, to: 1, period: 1800 }))
          .child(div().font_family(ZH).text_size(S(15)).text_color(INK).max_w(S(180)).truncate().child(label)),
        div().absolute().left(S(198)).top(S(130)).w(S(240)).font_family(MONO).text_size(10).text_color(GRAY).truncate()
          .child(`${space?.name ?? ""} · ${(space?.machine ?? "local").toUpperCase()}`),
        h_flex().absolute().right(16).top(14).gap(6).items_center()
          .child(div().font_family(MONO).text_size(12).font_semibold().text_color(color).child(st.label))
          .child(svg("mods/prts/diamond.svg").size(12).text_color(color).loop("opacity", { from: 0.3, to: 1, period: st.period })),
      ],
    }).h(S(160));
  }

  dispatch(blocked, done) {
    const cell = (zh, n, hot) => v_flex().id(`d-${zh}`).flex_1().h_full().items_center().justify_center().gap(0)
      .child(div().font_family(ZH).text_size(S(14)).text_color("#ffffffdd").child(zh))
      .child(div().font_family(NUM).font_black().text_size(S(26)).text_color(hot && n > 0 ? "#ffffff" : "#ffffffb0").child(String(n)));
    const badge = blocked > 0
      ? h_flex().absolute().right(14).top(-10).items_center().h(S(22)).bg(RED).px(7).gap(5).child(clockGlyph())
        .child(div().font_family(ZH).text_size(S(12)).text_color("#ffffff").child(`需介入 ${blocked}`)).loop("opacity", { from: 0.8, to: 1, period: 900 })
      : h_flex().absolute().right(14).top(-10).items_center().h(S(22)).bg("#3a2a18").px(8)
        .child(div().font_family(ZH).text_size(S(12)).text_color("#e8d3ae").child("全員正常"));
    return this.slab("t-dispatch", {
      bg: TAN, bgHover: TAN_HOVER, edge: TAN_EDGE, action: enter(MISSIONS),
      marks: [badge, diamond(blocked > 0, S(156), -8)],
      body: [
        div().absolute().left(0).top(0).bottom(0).w(3).bg(RED),
        div().absolute().left(S(16)).top(S(24)).child(title("調度", S(36), "#ffffff", 0.9)),
        div().absolute().left(S(16)).bottom(10).child(micro("Who needs whom", "#f6e8d0", 10)),
        div().absolute().left(S(132)).top(0).right(0).bottom(0).bg(TAN_DARK)
          .child(svg("mods/prts/stripes.svg").absolute().left(0).top(S(30)).w(S(330)).h(S(80)).text_color("#00000010"))
          .child(h_flex().absolute().left(0).top(0).right(0).h(S(28)).bg("#14110d").px(12).items_center().gap(8)
            .child(svg("mods/prts/icon-cell.svg").size(S(13)).text_color("#ffffffcc"))
            .child(div().font_family(ZH).text_size(S(14)).text_color("#ffffff").child("待處理")))
          .child(h_flex().absolute().left(0).top(S(28)).right(0).bottom(0)
            .child(cell("等待", blocked, true))
            .child(div().w(1).h_full().bg("#00000030"))
            .child(cell("完成", done, false))),
      ],
    }).w(S(458)).h(S(108)).ml(S(22));
  }

  missions(working, action) {
    const cells = Array.from({ length: 9 }, (_, i) => svg("mods/prts/icon-cell.svg").size(S(18)).text_color(i < working ? "#1d8fd0" : LINE_ART));
    const grid = h_flex().absolute().right(12).top(S(14)).w(S(60)).flex_wrap().gap(3).children(cells);
    return this.plain("t-missions", { zh: "任務", en: "Working now", value: String(working), art: grid, action, w: S(170) });
  }

  base(branch, tabs, action) {
    const marks = [
      h_flex().absolute().right(16).top(-10).items_center().h(S(22)).bg(TAN).px(7).gap(5)
        .child(svg("mods/prts/icon-cell.svg").size(S(12)).text_color("#ffffff"))
        .child(div().font_family(NUM).font_extrabold().text_size(S(14)).text_color("#ffffff").child(String(tabs))),
    ];
    return this.plain("t-base", {
      zh: "基建", en: "Branch in play", value: branch, mono: true, action, marks,
      art: svg("mods/prts/icon-base.svg").absolute().right(8).top(S(10)).w(S(84)).h(S(87)).text_color(LINE_ART),
    });
  }

  depot(count) {
    return this.slab("t-depot", {
      bg: CHAR, bgHover: "#252a30f5", edge: CHAR_EDGE, action: enter(DEPOT),
      body: [
        svg("mods/prts/stripes.svg").absolute().left(0).top(0).w(S(520)).h(S(140)).text_color("#ffffff0c"),
        svg("mods/prts/icon-box.svg").absolute().right(6).bottom(8).size(S(62)).text_color("#d4b06a66"),
        div().absolute().left(S(14)).top(S(8)).child(title("倉庫", S(28), WHITE, 0.92)),
        v_flex().absolute().left(S(14)).bottom(10).gap(1)
          .child(div().font_family(NUM).font_black().text_size(S(24)).text_color(GOLD).child(String(count)))
          .child(micro("terminals", "#8d939b")),
      ],
    }).w(S(120)).h(S(112));
  }

  menu() {
    const { space, tab } = activeTab();
    const list = agents();
    const sp = spaces();
    const working = list.filter((a) => a.status === "working").length;
    const blocked = list.filter((a) => a.status === "blocked").length;
    const done = list.filter((a) => a.status === "done").length;
    const attention = sp.some((s) => s.status === "blocked" || s.status === "done");
    const st = STATUS[tab?.status ?? "idle"];
    const color = { working: "#0a7fc0", blocked: "#c0700a", done: "#2e8b46" }[tab?.status] ?? "#7b8490";
    const branch = panes().find((p) => p.tab === tab?.id && p.branch)?.branch ?? space?.branch ?? "-";
    return v_flex().size_full().gap(6)
      .child(this.battle(tab, space, working, list.length, st, color))
      .child(h_flex().flex_none().gap(6).items_start()
        .child(this.plain("t-squads", {
          zh: "編隊", en: "Line up the squads", value: String(sp.length), action: enter(SQUADS),
          marks: [diamond(attention, 8, -8)],
          art: svg("mods/prts/icon-squads.svg").absolute().right(8).top(S(10)).w(S(96)).h(S(80)).text_color(LINE_ART),
        }))
        .child(this.plain("t-ops", {
          zh: "幹員", en: "Roster and reports", value: String(list.length), action: enter(ROSTER), mt: 6,
          marks: [diamond(blocked + done > 0, 8, -8)],
          art: svg("mods/prts/icon-ops.svg").absolute().right(10).top(S(8)).size(S(88)).text_color(LINE_ART),
        })))
      .child(this.dispatch(blocked, done))
      .child(h_flex().flex_none().gap(6).mt(6).items_start()
        .child(this.missions(working, enter(MISSIONS)))
        .child(this.base(branch, space?.tabs?.length ?? 0, enter(BASE)))
        .child(this.depot(terminals().length)));
  }

  footer() {
    return h_flex().size_full().items_center().px(6).font_family(MONO).text_size(10).text_color("#ffffff80")
      .child("RHODES ISLAND // PRTS · PRIMITIVE RHODES ISLAND TERMINAL SERVICE");
  }

  // ---- TERMINAL ------------------------------------------------------------------------------------------------------

  squareButton(id, icon, tip, action, sz = 44) {
    return div().id(id).relative().size(sz).flex_none().flex().items_center().justify_center().bg("#14171be6")
      .border_1().border_color("#ffffff30").text_color(WHITE).cursor_pointer()
      .hover((s) => s.bg("#232a32f0").text_color(ORANGE))
      .on_mouse_down("left", (_e, cx) => cx.stop_propagation()).on_click(action).tooltip(tip)
      .child(svg(icon).size(sz > 40 ? 22 : 20));
  }

  // One node of the map, like the game's: a circle on the spine, a dashed stem to an icon + label above or below it.
  node(n) {
    const W = NODE_W, L = NAV_LINE;
    const color = n.current ? WHITE : n.on ? ACCENT : "#d6dbe0";
    const at = (s) => div().absolute().left(Math.round(W / 2 - s / 2)).top(Math.round(L - s / 2)).size(s);
    const ring = (s, c) => at(s).rounded_full().border_1().border_color(c);
    const stem = (top, len) => v_flex().absolute().left(Math.round(W / 2) - 1).top(top).w(2).h(len).gap(5).overflow_hidden()
      .children(Array.from({ length: Math.ceil(len / 11) }, () => div().w(2).h(6).flex_none().bg("#ffffff70")));
    const icon = svg(n.icon).size(n.current ? 48 : 42).text_color(color);
    const label = title(n.zh, n.current ? 28 : 24, color, 0.98);
    const group = v_flex().absolute().left(0).w(W).items_center().gap(6)
      .children(n.up ? [icon, label] : [label, icon]);
    const r = n.current ? 30 : 22;
    return div().id(`node-${n.zh}`).relative().w(W).h(NAV_H).flex_none().cursor_pointer()
      .on_mouse_down("left", (_e, cx) => cx.stop_propagation()).on_click(() => { closeNav(); n.act(); })
      .when(Boolean(n.current), (el) => el
        .child(ring(170, "#ffffff2c").loop("opacity", { from: 0.5, to: 1, period: 3200 }))
        .child(ring(104, "#ffffff55")))
      .child(n.up ? stem(110, L - r - 110) : stem(L + r, 190 - L - r))
      .child(n.up ? group.top(n.current ? 14 : 24) : group.top(196))
      .child(at(2 * r).flex().items_center().justify_center().bg("#05080e")
        .child(n.current
          ? svg("mods/prts/node-cur.svg").size(2 * r).text_color(WHITE).loop("opacity", { from: 0.65, to: 1, period: 2600 })
          : svg("mods/prts/node-dot.svg").size(2 * r).text_color(color)))
      .when(Boolean(n.on), (el) => el.child(ring(2 * r + 18, ACCENT + "88")))
      .when(Boolean(n.alert), (el) => el.child(diamond(true, Math.round(W / 2 - r - 14), L - r - 12)));
  }

  // TERMINAL top bar: back + house at left, search / settings at right. The node map is the popup (navpop).
  nav() {
    const root = layout();
    const d = find(root, "drawer"), p = find(root, "panel");
    const side = Boolean((d && !d.hidden) || (p && !p.hidden));
    return h_flex().size_full().items_center().gap(8).pl(96).pr(14).bg("#04070bd2").border_b(1).border_color("#ffffff26")
      .child(this.squareButton("back", "mods/prts/arrow-left.svg", side ? "Close the side panel" : "Back to HOME", () => (side ? closeSide() : go("home")), 36))
      .child(div().id("home-btn").relative().w(84).h(36).flex_none().flex().items_center().justify_center().bg("#14171be6")
        .border_1().border_color("#ffffffb0").text_color(WHITE).cursor_pointer()
        .hover((s) => s.bg("#232a32f0").text_color(ORANGE))
        .on_mouse_down("left", (_e, cx) => cx.stop_propagation()).on_click(() => toggleNav()).tooltip("Node map (cmd-;)")
        .child(svg("mods/prts/home.svg").size(22)))
      .child(div().flex_1())
      .child(this.squareButton("palette", "mods/workspace-chrome/search.svg", "Command palette", () => run("app.palette"), 36))
      .child(this.squareButton("settings", "mods/workspace-chrome/settings.svg", "Settings", () => run("app.settings"), 36));
  }

  // The popup: node map 首頁 編隊 幹員 終端 基建 任務, dark translucent like the game's top area.
  navpop() {
    const root = layout();
    const d = find(root, "drawer"), db = find(root, "drawer-body"), p = find(root, "panel"), pb = find(root, "panel-body");
    const open = d && !d.hidden ? db?.active : null;
    const sort = shared("agents.sort");
    const alert = agents().some((a) => a.status === "blocked" || a.status === "done");
    const nodes = [
      { zh: "首頁", icon: "mods/prts/home.svg", act: () => go("home") },
      { zh: "編隊", icon: "mods/prts/icon-squads.svg", up: true, on: open === "d-spaces", act: SQUADS },
      { zh: "幹員", icon: "mods/prts/icon-ops.svg", on: open === "d-agents" && sort === "grouped", alert, act: ROSTER },
      { zh: "終端", icon: "mods/prts/diamond.svg", up: true, current: true, act: () => { closeSide(); startHere(); } },
      { zh: "基建", icon: "mods/prts/icon-base.svg", up: true, on: Boolean(p && !p.hidden && pb?.active === "changes"), act: BASE },
      { zh: "任務", icon: "mods/prts/icon-maze.svg", on: open === "d-agents" && sort !== "grouped", act: MISSIONS },
    ];
    return div().size_full().relative().bg("#05080eeb").border_b(1).border_color("#ffffff40")
      .child(div().absolute().left(0).right(0).top(NAV_LINE - 18).h(36).bg("#ffffff0a").border_t(1).border_b(1).border_color("#ffffff14"))
      .child(div().absolute().left(0).right(0).top(NAV_LINE).h(1).bg("#ffffff38"))
      .child(div().absolute().right(24).bottom(10).font_family(MONO).text_size(10).text_color("#ffffff55").child("PRTS // NODE MAP"))
      .child(h_flex().size_full().justify_center().gap(28).children(nodes.map((n) => this.node(n))));
  }

  // 前往上一次作戰: shown only while some other agent is blocked or done. Renders nothing otherwise.
  lastop() {
    const a = topAgent(agents().filter((x) => x.status === "blocked" || x.status === "done"), true);
    if (!a) return div().w(0).h(0);
    const hot = a.status === "blocked";
    return v_flex().id("lastop").w(230).cursor_pointer().on_click(() => run("pane.focus", { pane: a.pane }))
      .child(h_flex().h(22).px(10).items_center().gap(6).bg("#14171b")
        .child(svg("mods/prts/diamond.svg").size(9).text_color(hot ? RED : GREEN).loop("opacity", { from: 0.35, to: 1, period: hot ? 900 : 2400 }))
        .child(div().font_family(ZH).text_size(12).text_color("#ffffffdd").child("前往上一次作戰")))
      .child(h_flex().h(46).px(10).items_center().gap(8).bg(PAPER).hover((s) => s.bg(PAPER_HOVER))
        .child(div().flex_1().min_w(0).font_family(ZH).text_size(16).text_color(INK).truncate().child(a.space_name || a.tab_name || "-"))
        .child(div().flex_none().font_family(ZH).text_size(12).text_color(hot ? RED : "#2e8b46").child(hot ? "需介入" : "已完成")));
  }

  render() {
    const t = theme();
    switch (props()?.role) {
      case "hero": return this.hero(t);
      case "menu": return this.menu();
      case "voice": return this.voice();
      case "footer": return this.footer();
      case "spacer": return div().size_full();
      case "nav": return this.nav();
      case "navpop": return this.navpop();
      case "lastop": return this.lastop();
      default: return this.top();
    }
  }
}
