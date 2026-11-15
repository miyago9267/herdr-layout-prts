// TERMINAL stage screen (the house button / prts.nav overlay), after the game's stage select:
// ATTENTION cards for spaces with blocked or working agents, a TO-DO LIST of finished / idle agents,
// 前往上一次作戰 bottom-right, and an icon bar with a white triangle over the current screen.
// Built from live Herdr data; main.js passes what it owns (screen nodes, close, pick).

import { div, svg } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { spaces, agents } from "herdr";

const MONO = "Geist Mono";
const ZH = "Hiragino Sans W8";
const NUM = "Geist";
const WHITE = "#f4f7fa";
const INK = "#14171b";
const GRAY = "#868d96";
const PAPER = "#ecebe7f0";
const PAPER_HOVER = "#f6f5f1f6";
const YELLOW = "#e8c21a";
const RED = "#e2292e";
const ORANGE = "#f0801f";
const GREEN = "#2e8b46";
const BLUE = "#1d8fd0";
const ACCENT = "#4fc3f7";

const clean = (s) => (s ?? "").replace(/^[^\p{L}\p{N}]+/u, "").trim();
const text = (s, size, color, font = ZH) => div().font_family(font).text_size(size).text_color(color).child(s);

function pill(label) {
  return h_flex().flex_none().items_center()
    .child(div().h(22).px(9).flex().items_center().bg(YELLOW).font_family(ZH).text_size(12).text_color(INK).child(label))
    .child(svg("mods/prts/badge-tip.svg").w(8).h(22).text_color(YELLOW));
}

function head(label, note) {
  return h_flex().flex_none().h(26).items_center().gap(8)
    .child(svg("mods/prts/diamond.svg").size(10).text_color(YELLOW))
    .child(div().font_family(MONO).font_bold().text_size(12).text_color(WHITE).child(label))
    .child(div().flex_1().h(1).bg("#ffffff2a"))
    .child(div().font_family(MONO).text_size(10).text_color("#ffffff66").child(note));
}

function dim(line) {
  return div().flex_none().h(56).flex().items_center().px(14).bg("#ffffff08").border_1().border_color("#ffffff14")
    .font_family(ZH).text_size(14).text_color("#ffffff55").child(line);
}

// One big card per space: dark strip (icon, label, progress) + paper face (name, state, pill).
function attentionCard(g, pick) {
  const hot = g.top.status === "blocked";
  const edge = hot ? RED : BLUE;
  const total = g.list.length;
  const busy = g.list.filter((a) => a.status === "working").length;
  return h_flex().id(`st-a-${g.id}`).flex_none().h(124).relative().cursor_pointer().on_click(() => pick(g.top))
    .child(v_flex().w(116).flex_none().h_full().bg(INK).p(10).gap(4).justify_between()
      .child(h_flex().items_center().gap(6)
        .child(svg("mods/prts/icon-squads.svg").size(30).text_color("#c9a45a"))
        .child(div().font_family(MONO).text_size(9).text_color(GRAY).child("SQUAD")))
      .child(v_flex().gap(4)
        .child(div().font_family(MONO).text_size(10).text_color("#ffffffaa").child(`${busy}/${total} WORKING`))
        .child(div().relative().h(3).w_full().bg("#ffffff22")
          .child(div().absolute().left(0).top(0).h(3).w(Math.round(96 * busy / total)).bg(edge)))))
    .child(div().flex_1().min_w(0).h_full().relative().overflow_hidden().bg(PAPER).hover((s) => s.bg(PAPER_HOVER))
      .child(svg("mods/prts/lines.svg").absolute().right(14).top(14).w(150).h(30).text_color("#00000012"))
      .child(div().absolute().left(0).top(0).bottom(0).w(4).bg(edge))
      .child(v_flex().absolute().left(18).top(10).right(14).gap(2)
        .child(div().max_w(420).font_family(ZH).text_size(32).text_color(INK).truncate().child(g.name))
        .child(div().font_family(MONO).text_size(10).text_color(GRAY).truncate()
          .child(`${total} AGENT${total > 1 ? "S" : ""} · ${(g.top.tab_name || "-").toUpperCase()}`)))
      .child(h_flex().absolute().left(18).bottom(10).items_center().gap(10)
        .child(pill(hot ? "需介入" : "運行中"))
        .child(div().max_w(360).font_family(ZH).text_size(13).text_color("#3a3f46").truncate().child(clean(g.top.title) || g.top.program?.name || "")))
      .child(svg("mods/prts/diamond.svg").absolute().right(14).bottom(12).size(16).text_color(hot ? RED : BLUE)
        .loop("opacity", { from: 0.3, to: 1, period: hot ? 900 : 1600 })));
}

// Smaller slab: icon square, grey caption (space), big title, pill.
function todoSlab(a, pick) {
  const done = a.status === "done";
  return h_flex().id(`st-t-${a.address}`).flex_none().h(62).cursor_pointer().on_click(() => pick(a))
    .child(div().w(62).flex_none().h_full().bg(INK).flex().items_center().justify_center()
      .child(svg(done ? "mods/prts/icon-ops.svg" : "mods/prts/icon-cell.svg").size(34).text_color(done ? "#86b22d" : "#6f7b88")))
    .child(h_flex().flex_1().min_w(0).h_full().items_center().gap(8).px(12).bg(PAPER).hover((s) => s.bg(PAPER_HOVER))
      .child(v_flex().flex_1().min_w(0).gap(1)
        .child(div().font_family(MONO).text_size(9).text_color(GRAY).truncate().child((a.space_name || "-").toUpperCase()))
        .child(div().font_family(ZH).text_size(18).text_color(INK).truncate().child(clean(a.title) || a.tab_name || "-")))
      .child(pill(done ? "已完成" : "待命")));
}

function lastSlab(a, pick) {
  if (!a) return div().flex_none().h(58).w_full().flex().items_center().px(14).bg("#ffffff08").border_1().border_color("#ffffff14")
    .font_family(ZH).text_size(13).text_color("#ffffff44").child("前往上一次作戰　—");
  const hot = a.status === "blocked";
  return v_flex().id("st-last").flex_none().w_full().cursor_pointer().on_click(() => pick(a))
    .child(h_flex().h(22).px(10).items_center().gap(6).bg(INK)
      .child(svg("mods/prts/diamond.svg").size(9).text_color(hot ? RED : GREEN).loop("opacity", { from: 0.35, to: 1, period: hot ? 900 : 2400 }))
      .child(text("前往上一次作戰", 12, "#ffffffdd")))
    .child(h_flex().h(46).px(12).items_center().gap(8).bg(PAPER).hover((s) => s.bg(PAPER_HOVER))
      .child(div().flex_1().min_w(0).font_family(ZH).text_size(17).text_color(INK).truncate().child(a.space_name || a.tab_name || "-"))
      .child(div().flex_none().font_family(ZH).text_size(12).text_color(hot ? RED : GREEN).child(hot ? "需介入" : "已完成")));
}

function iconBar(nodes, close) {
  const item = (n) => {
    const color = n.current ? WHITE : n.on ? ACCENT : "#aab1b9";
    return v_flex().id(`st-n-${n.zh}`).relative().w(104).flex_none().h_full().items_center().justify_end().gap(4).pb(8).cursor_pointer()
      .on_mouse_down("left", (_e, cx) => cx.stop_propagation()).on_click(() => { close(); n.act(); })
      .hover((s) => s.bg("#ffffff0d"))
      .child(div().h(12).flex_none().child(n.current ? svg("mods/prts/tri.svg").w(20).h(12).text_color(WHITE) : div()))
      .child(svg(n.icon).size(n.current ? 36 : 30).text_color(color))
      .child(div().font_family(ZH).text_size(14).text_color(color).child(n.zh))
      .when(Boolean(n.alert), (el) => el.child(svg("mods/prts/diamond.svg").absolute().right(24).top(18).size(14).text_color(ORANGE)
        .loop("opacity", { from: 0.4, to: 1, period: 1200 })));
  };
  return h_flex().flex_none().h(88).w_full().items_end().justify_center().gap(14).bg("#0b0e12f2").border_t(1).border_color("#ffffff2a")
    .children(nodes.map(item));
}

/** o = { on, nodes: [{zh, icon, current?, on?, alert?, act}], close(), pick(agent), focus? (focus handle for Esc) }. Empty space and Esc close it. */
export function stage(o) {
  const list = agents();
  const groups = new Map();
  for (const a of list) {
    if (a.status !== "blocked" && a.status !== "working") continue;
    let g = groups.get(a.space);
    if (!g) groups.set(a.space, g = { id: a.space, name: a.space_name || spaces().find((s) => s.id === a.space)?.name || "-", list: [], top: a });
    g.list.push(a);
    if (a.status === "blocked" && g.top.status !== "blocked") g.top = a;
  }
  const cards = [...groups.values()].sort((x, y) => (y.top.status === "blocked") - (x.top.status === "blocked") || y.top.seq - x.top.seq).slice(0, 5);
  const todo = list.filter((a) => a.status === "done" || a.status === "idle")
    .sort((x, y) => (y.status === "done") - (x.status === "done") || y.seq - x.seq).slice(0, 6);
  const last = [...list].filter((a) => (a.status === "blocked" || a.status === "done") && !a.focused)
    .sort((x, y) => (y.status === "blocked") - (x.status === "blocked") || y.seq - x.seq)[0];
  const pick = (a) => { o.close(); o.pick(a); };
  return div().id("stage").size_full().relative().bg("#05080ef0")
    .on_mouse_down("left", (_e, cx) => cx.stop_propagation()).on_click(() => o.close())
    .when(Boolean(o.focus), (el) => el.track_focus(o.focus).on_key_down((e) => { if (e.key === "escape") o.close(); })).border_b(1).border_color("#ffffff40")
    .opacity(o.on ? 1 : 0).transition("opacity", { duration: o.on ? 220 : 180, easing: "ease-out" })
    .child(v_flex().size_full()
      .child(h_flex().flex_1().min_h(0).gap(28).px(36).pt(18).pb(14)
        .child(v_flex().flex_1().min_w(0).h_full().gap(10)
          .child(head("ATTENTION", "注意"))
          .child(v_flex().id("st-attn").flex_1().min_h(0).gap(10).overflow_y_scroll()
            .children(cards.length ? cards.map((g) => attentionCard(g, pick)) : [dim("— 目前沒有需要處理或運行中的幹員 —")])))
        .child(v_flex().w(400).flex_none().h_full().gap(10)
          .child(head("TO-DO LIST", "待辦"))
          .child(v_flex().id("st-todo").flex_1().min_h(0).gap(8).overflow_y_scroll()
            .children(todo.length ? todo.map((a) => todoSlab(a, pick)) : [dim("— 沒有待命或已完成的幹員 —")]))
          .child(lastSlab(last, pick))))
      .child(iconBar(o.nodes, o.close)))
    .child(div().absolute().right(14).bottom(92).font_family(MONO).text_size(9).text_color("#ffffff40").child("PRTS // STAGE"));
}
