import { div, svg } from "gpui-kit";
import { h_flex } from "gpui-base";

// Uppercase mono section label with a thin ice-blue marker.
export function sectionLabel(t, text) {
  return h_flex().gap(7).items_center()
    .child(div().w(2).h(12).flex_none().bg(t.accent))
    .child(div().font_family("Geist Mono").font_semibold().text_size(11).text_color(t.muted).child(text));
}

// Faint halftone backdrop for a panel, drawn first so content paints over it.
// Native .loop only, no timers.
export function backdrop(t) {
  return div().absolute().top(0).left(0).w_full().h_full().overflow_hidden()
    .child(svg("mods/prts/dots.svg").absolute().top(0).right(0).w(520).h(520).text_color("#ffffff")
      .loop("opacity", { from: 0.03, to: 0.1, period: 8000 }));
}
