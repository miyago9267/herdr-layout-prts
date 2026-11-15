// PRTS overlays drawn after the game's: the 任務完成 banner and the screen-transition card.
// Both take a context from main.js: { emblem, ZH, HEAVY, MONO, WHITE, ... } so fonts and the emblem stay defined once.

import { div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";

const YELLOW = "#e8c21a";

// Banner: a translucent band opens from the middle; the emblem + text group is centred in the window and the emblem breaks out of the band;
// 任務 / 完成 with small MISSION / ACCOMPLISHED beside it, inside thin corner brackets.
// c: { on, out, space, title, pane, height, bandH, emblem, onClick, ZH, HEAVY, MONO, WHITE }
export function missionView(c) {
  const mid = Math.round(c.height / 2);
  const corner = (left, top) => div().absolute().size(22)
    .when(left, (el) => el.left(0).border_l(2)).when(!left, (el) => el.right(0).border_r(2))
    .when(top, (el) => el.top(0).border_t(2)).when(!top, (el) => el.bottom(0).border_b(2)).border_color(c.WHITE);
  const zh = (text) => div().font_family(c.ZH).text_size(110).line_height(1.0).text_color(c.WHITE).child(text);
  const en = (text) => div().font_family(c.HEAVY).font_extrabold().text_size(34).line_height(1.05).text_color(c.WHITE).child(text);
  return v_flex().id("mission-shade").size_full().justify_center()
    .on_mouse_down("left", (_e, cx) => cx.stop_propagation()).on_click(c.onClick.dismiss)
    .child(div().id("mission").w_full().h(c.height).flex_none().relative().cursor_pointer()
      .opacity(c.out ? 0 : 1).transition("opacity", { duration: 450, easing: "ease-in" })
      .on_click(c.onClick.focus)
      .child(div().absolute().left(0).w_full().bg("#111111d9")
        .top(c.on ? mid - c.bandH / 2 : mid).h(c.on ? c.bandH : 0)
        .transition("top", { duration: 280, easing: "ease-out" }).transition("height", { duration: 280, easing: "ease-out" }))
      .child(h_flex().absolute().left(0).top(0).w_full().h(c.height).items_center().justify_center().gap(16)
        .opacity(c.on ? 1 : 0).transition("opacity", { duration: 300, delay: 180, easing: "ease-out" })
        .child(c.emblem(300))
        .child(div().relative().px(26).py(12).flex_none()
          .child(corner(true, true)).child(corner(false, true)).child(corner(true, false)).child(corner(false, false))
          .child(h_flex().items_center().gap(14)
            .child(v_flex().child(zh("任務")).child(zh("完成")))
            .child(v_flex().child(en("MISSION")).child(en("ACCOMPLISHED"))))))
      .child(div().absolute().right(28).top(mid + c.bandH / 2 - 24).font_family(c.MONO).text_size(11).text_color("#ffffff88")
        .opacity(c.on ? 1 : 0).transition("opacity", { duration: 300, delay: 400 })
        .child(`${c.space}${c.title ? " · " + c.title : ""}${c.pane ? " · CLICK TO OPEN" : ""}`)));
}

// Transition card: dimmed window, emblem at centre, lines with square nodes from the left, a dot grid, a vertical line
// with a yellow square, and a tip near the bottom. c: { phase (0 hidden, 1 shown, 2 leaving), tip, emblem, ZH, WHITE }
export function curtainView(c) {
  const on = c.phase === 1, grow = c.phase >= 1;
  const sq = (s) => div().size(s).bg(c.WHITE);
  const hline = (y, nodeRight) => [
    div().absolute().left(0).top(y).h(1).bg(c.WHITE).w(grow ? 3000 : 0).transition("width", { duration: 420, easing: "ease-out" }),
    sq(10).absolute().right(nodeRight).top(y - 5).opacity(grow ? 1 : 0).transition("opacity", { duration: 200, delay: 220 }),
  ];
  const dots = v_flex().gap(34).children([0, 1, 2, 3].map(() => h_flex().gap(34).children([0, 1, 2, 3, 4].map(() => div().size(3).bg("#ffffffcc")))));
  return div().size_full().relative().bg("#1a1c1f")
    .opacity(on ? 0.92 : 0).transition("opacity", { duration: on ? 120 : 250, easing: "ease-out" })
    .child(v_flex().absolute().left(0).top(0).size_full().justify_center()
      .child(h_flex().w_full().h(440).flex_none().items_center()
        .child(div().relative().flex_1().h_full().overflow_hidden()
          .children(hline(222, 0)).children(hline(370, 120)).child(sq(10).absolute().right(120).top(410)).child(sq(10).absolute().right(280).top(410)))
        .child(div().w(36).flex_none())
        .child(c.emblem(220))
        .child(div().w(36).flex_none())
        .child(div().relative().flex_1().h_full().overflow_hidden()
          .child(div().absolute().left(0).top(70).child(dots))
          .child(div().absolute().left(0).top(222).h(1).bg(c.WHITE).w(grow ? 3000 : 0).transition("width", { duration: 420, easing: "ease-out" }))
          .child(div().absolute().left(190).top(120).w(1).h(grow ? 280 : 0).bg(c.WHITE).transition("height", { duration: 420, easing: "ease-out" }))
          .child(div().absolute().left(180).top(211).size(22).bg(YELLOW))
          .child(sq(10).absolute().left(186).top(380)))))
    .child(div().absolute().bottom(70).left(0).w_full().flex().justify_center()
      .child(div().font_family(c.ZH).text_size(15).text_color(c.WHITE).child(c.tip)));
}
