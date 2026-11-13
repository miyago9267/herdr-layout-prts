import { View, div, svg, image } from "gpui-kit";
import { h_flex, ScrollHandle } from "gpui-base";
import { spaces, panes, run, openOverlay, theme, window, shared, layout, settings, props } from "herdr";

// PRTS tab bar: shipped `tabs` restyled as game slabs. Roles by props.role: (none) tab bar, strip = title strip above the
// console, foot = bracket strip below it. Square corners, paper-white selected slab with a 3px colored left edge.
const ZH = "Hiragino Sans W8";
const MONO = "Geist Mono";
const INK = "#14171b";
const PAPER = "#ecebe7f0";
const ACCENT = "#4fc3f7";
const ORANGE = "#f0801f";
const GREEN = "#86b22d";
const DIM = "#ffffff59";
const STATE = { blocked: ORANGE, done: GREEN, working: ACCENT };
const diamond = (color, size) => svg("mods/prts-tabs/diamond.svg").size(size).flex_none().text_color(color);
// An L-shaped corner bracket: two 1px bars.
const corner = (top, left, color) => {
  const el = div().absolute().w(10).h(10);
  el.child(div().absolute().left(0).w(10).h(1).bg(color).when(top, e => e.top(0)).when(!top, e => e.bottom(0)));
  el.child(div().absolute().top(0).h(10).w(1).bg(color).when(left, e => e.left(0)).when(!left, e => e.right(0)));
  return el.when(top, e => e.top(0)).when(!top, e => e.bottom(0)).when(left, e => e.left(0)).when(!left, e => e.right(0));
};

function find(node, id) {
  if (node?.id === id) return node;
  for (const child of node?.children ?? []) {
    const found = find(child, id);
    if (found) return found;
  }
  return null;
}

export default class Tabs extends View {
  init() {
    this.pressed = null;
    this.scroll = ScrollHandle.new();
    this.panels = JSON.parse(localStorage.getItem("panels") ?? "{}");
  }

  // The side panel is remembered per space: switching shows that space's choice
  // (closed if it never had one), and opening or closing it records it.
  syncPanel(space, panel, body, enabled) {
    if (!space || !panel) return;
    const now = panel.hidden ? null : body?.active ?? null;
    if (space.id !== this.space) {
      const first = this.space === undefined;
      this.space = space.id; this.pending = null;
      if (!(first && !(space.id in this.panels))) {
        const stored = this.panels[space.id] ?? null, want = enabled.includes(stored) ? stored : null;
        if (want !== now) {
          this.pending = { want, until: Date.now() + 1000 };
          if (want) { run("layout.select", { stack: "panel-body", child: want }); run("layout.show", { id: "panel" }); }
          else run("layout.hide", { id: "panel" });
          return;
        }
      }
    }
    // Until the restore lands (or something else won), the old state isn't a choice.
    if (this.pending) {
      if (this.pending.want !== now && Date.now() < this.pending.until) return;
      this.pending = null;
    }
    if (this.panels[space.id] === now) return;
    this.panels[space.id] = now;
    localStorage.setItem("panels", JSON.stringify(this.panels));
  }

  strip(space) {
    const tab = (space?.tabs ?? []).find(x => x.active);
    const program = panes().find(p => tab && p.tab === tab.id)?.program;
    const name = tab ? (/^tb\d+$/.test(tab.name) ? program?.name ?? "Terminal" : tab.name) : "";
    const hot = (space?.tabs ?? []).some(x => x.status === "blocked");
    return h_flex().relative().size_full().items_center().gap(8).px(14).overflow_hidden().bg("#05080eb3")
      .child(svg("mods/prts/stripes.svg").absolute().left(0).top(0).w(520).h(140).text_color("#ffffff08"))
      .child(corner(true, true, ACCENT)).child(corner(true, false, ACCENT))
      .child(diamond(hot ? ORANGE : ACCENT, 9))
      .child(div().font_family(ZH).text_size(12).text_color("#ffffffd9").child("作戰終端"))
      .child(div().font_family(MONO).text_size(10).text_color(DIM).child("//"))
      .child(div().font_family(MONO).text_size(10).text_color("#ffffffa6").truncate().child(String(name).toUpperCase()))
      .child(div().flex_1().h(1).bg("#ffffff14"))
      .child(div().font_family(MONO).text_size(9).text_color(DIM).child("PRTS // TERMINAL"));
  }

  foot() {
    return div().relative().size_full().bg("#05080eb3")
      .child(corner(false, true, ACCENT)).child(corner(false, false, ACCENT));
  }

  render() {
    const t = theme();
    if (props()?.role === "strip") return this.strip(spaces().find(p => p.active));
    if (props()?.role === "foot") return this.foot();
    const space = spaces().find(p => p.active);
    const shown = space?.tabs ?? [];
    const active = shown.findIndex(tab => tab.active);
    const selected = shown[active]?.id;
    if (selected !== this.selected || active !== this.selectedIndex) {
      this.selected = selected;
      this.selectedIndex = active;
      if (active >= 0) this.scroll.scroll_to_item(active);
    }
    const stop = (_e, cx) => cx.stop_propagation();
    const button = (id, label, action) => div().id(id).size(28).flex_none().flex().items_center().justify_center().text_color("#ffffff8c").hover(s => s.bg("#ffffff1f").text_color("#ffffff"))
      .on_mouse_down("left", stop).on_click(action).child(label);
    const item = (c, i) => {
      const program = panes().find(p => p.tab === c.id && p.program?.agent)?.program ?? panes().find(p => p.tab === c.id)?.program;
      const name = /^tb\d+$/.test(c.name) ? program?.name ?? "Terminal" : c.name;
      const edge = c.active ? STATE[c.status] ?? ACCENT : STATE[c.status] ? STATE[c.status] + "99" : "#ffffff1f";
      return h_flex().id(`tab-${c.id}`).h(32).px(11).gap(8).items_center().flex_none()
        // A rename or status dot on this or an earlier tab can push the active one out.
        .when(i <= active, el => el.on_size_change((_size, cx) => { this.scroll.scroll_to_item(active); cx.notify(); }))
        .border_l(3).border_color(edge).bg(c.active ? PAPER : "#ffffff12").text_color(c.active ? INK : "#ffffffa6")
        .hover(s => s.bg(c.active ? "#f6f5f1f6" : "#ffffff24"))
        .on_mouse_down("left", (e, cx) => { cx.stop_propagation(); this.pressed = i; if (e.click_count === 2) run("tab.rename", { id: c.id }); })
        .on_mouse_up("left", () => {
          const from = this.pressed; this.pressed = null;
          if (from !== null && from !== i) run("tab.move", { id: shown[from].id, index: space.tabs.findIndex(x => x.id === c.id) + 1 });
          else run("tab.select", { id: c.id });
        })
        .on_mouse_down("right", (_e, cx) => { cx.stop_propagation(); openOverlay({ mod: "menu", kind: "popup", width: 200, props: { tab: "tab", target: { id: c.id, space: space.id } } }); })
        .when(Boolean(program?.icon), el => el.child(program.tint ? svg(program.icon).size(14).text_color(c.active ? INK : "#ffffff99") : image(program.icon).size(14)))
        .child(div().max_w(170).truncate().font_family(ZH).text_size(c.active ? 13 : 12.5).child(c.zoomed ? `${name} Z` : name))
        .when(c.status === "working", el => el.child(diamond(ACCENT, 9)))
        .when(c.status === "done", el => el.child(diamond(GREEN, 9)))
        .when(c.status === "blocked", el => el.child(diamond(ORANGE, 9).loop("opacity", { from: 0.35, to: 1, period: 900 })))
        .when(c.active, el => el.child(div().id(`close-${c.id}`).text_color("#14171b99").hover(s => s.text_color(INK)).on_mouse_down("left", stop).on_click((_e, cx) => { cx.stop_propagation(); run("tab.close", { id: c.id }); }).child(svg("mods/pane/close.svg").size(12))));
    };
    const root = layout(), sidebar = find(root, "sidebar"), w = window();
    // Old saved rails and a dragged-narrow sidebar can be smaller than the window buttons.
    const lightsPadding = w?.platform === "macos" && w.titlebar === "none" && !w.fullscreen && root?.traffic_lights
      ? Math.max(10, (root.traffic_lights[0] + 64) / settings().zoom - (sidebar?.hidden ? 0 : sidebar?.size?.px ?? 0))
      : 10;
    const panel = find(root, "panel"), body = find(root, "panel-body");
    const enabled = shared("workspace.panels") ?? ["files", "changes"];
    this.syncPanel(space, panel, body, enabled);
    const panelButton = (id, label, icon) => {
      const on = panel && !panel.hidden && body?.active === id;
      return h_flex().id(`panel-${id}`).h(28).px(9).gap(5).flex_none().items_center()
        .font_family(MONO).text_size(11).bg(on ? PAPER : "#ffffff12").text_color(on ? INK : "#ffffffa6")
        .hover(s => s.bg(on ? "#f6f5f1f6" : "#ffffff24")).on_mouse_down("left", stop)
        .on_click(() => {
          if (on) run("layout.hide", { id: "panel" });
          else { run("layout.select", { stack: "panel-body", child: id }); run("layout.show", { id: "panel" }); }
        }).child(svg(icon).size(14)).child(label);
    };
    return h_flex().size_full().min_w(0).px(8).pl(lightsPadding).gap(4).items_center().bg("#05080ed9").border_b(1).border_color("#ffffff1f")
      .on_mouse_up("left", () => { this.pressed = null; })
      .on_scroll_wheel(e => { if (Math.abs(e.delta.y) >= 1) run(e.delta.y > 0 ? "tab.prev" : "tab.next"); })
      .child(h_flex().id("tab-scroll").flex_1().min_w(0).h_full().items_center().gap(4).overflow_x_scrollbar().track_scroll(this.scroll)
        .on_size_change((_size, cx) => { if (active >= 0) { this.scroll.scroll_to_item(active); cx.notify(); } })
        .children(shown.map(item)))
      .child(button("tab-new", "+", () => openOverlay({ mod: "new-menu", kind: "popup", width: 250, height: 512 })))
      .when(enabled.includes("files"), el => el.child(panelButton("files", "Files", "mods/files/file.svg")))
      .when(enabled.includes("changes"), el => el.child(panelButton("changes", "Changes", "mods/changes/changes.svg")))
      .when(w?.buttons, el => el.child(button("minimize", w.platform === "windows" ? svg("mods/prts-tabs/win-min.svg").size(16) : "−", () => run("window.minimize")))
        .child(button("maximize", w.platform === "windows" ? svg(`mods/prts-tabs/${w.maximized ? "win-restore" : "win-max"}.svg`).size(16) : "□", () => run("window.maximize")))
        .child(button("close-window", w.platform === "windows" ? svg("mods/prts-tabs/win-close.svg").size(16) : svg("mods/pane/close.svg").size(13), () => run("window.close"))));
  }
}
