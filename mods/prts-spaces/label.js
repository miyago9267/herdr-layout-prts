import { div, svg } from "gpui-kit";
import { h_flex } from "gpui-base";

// Uppercase mono section label with a thin ice-blue marker.
export function sectionLabel(t, text) {
  return h_flex().gap(7).items_center()
    .child(div().w(2).h(12).flex_none().bg(t.accent))
    .child(div().font_family("Geist Mono").font_semibold().text_size(11).text_color(t.muted).child(text));
}

export const ZH = "Hiragino Sans W8";
export const MONO = "Geist Mono";
export const INK = "#14171b";
export const PAPER = "#ecebe7f0";
export const PAPER_HOVER = "#f6f5f1f6";
export const SLAB = "#14171bcc";
export const SLAB_HOVER = "#23282fdd";
export const LIGHT = "#f4f7fa";
export const BLUE = "#4fc3f7";
export const GREEN = "#86b22d";
export const ORANGE = "#f0801f";

// Dark 22px strip header with a diamond: the title is Chinese + mono, "編隊 // SQUAD".
export function strip(title, right) {
  return h_flex().h(26).flex_none().px(10).gap(7).items_center().bg(INK)
    .child(svg("mods/prts/diamond.svg").size(9).flex_none().text_color(BLUE))
    .child(div().font_family(ZH).text_size(12).text_color("#ffffffdd").child(title))
    .child(div().flex_1())
    .when(Boolean(right), (el) => el.child(right));
}

// Small mono group label with a thin rule running to the right.
export function groupLabel(text, color = "#9aa1ab") {
  return h_flex().gap(8).items_center().flex_1().min_w(0)
    .child(div().flex_none().max_w(150).truncate().font_family(MONO).text_size(10.5).text_color(color).child(text))
    .child(div().flex_1().h(1).bg("#ffffff24"));
}

// A status mark on a slab: blocked blinks orange, done green, working blue (slow pulse), idle none.
export function mark(status) {
  if (status === "blocked") return svg("mods/prts-spaces/diamond-solid.svg").size(10).flex_none().text_color(ORANGE).loop("opacity", { from: 0.25, to: 1, period: 900 });
  if (status === "done") return svg("mods/prts-spaces/diamond-solid.svg").size(10).flex_none().text_color(GREEN);
  if (status === "working") return svg("mods/prts/diamond.svg").size(10).flex_none().text_color(BLUE).loop("opacity", { from: 0.35, to: 1, period: 1400 });
  return null;
}

// Faint halftone backdrop for a panel, drawn first so content paints over it.
// Native .loop only, no timers.
export function backdrop(t) {
  return div().absolute().top(0).left(0).w_full().h_full().overflow_hidden()
    .child(svg("mods/prts/dots.svg").absolute().top(0).right(0).w(520).h(520).text_color("#ffffff")
      .loop("opacity", { from: 0.03, to: 0.1, period: 8000 }));
}
