// HOME tile tilt: Herdr can't rotate live UI, so each tile gets a slanted SVG plate behind it (a rising top edge,
// a wedge on the right, a thin drop on the bottom: right side taller) and tiles further right sit a few px lower
// (the caller's mt). Text stays straight. The plates are pixel-exact files, one per tile size: slant-<w>x<h>.svg.

import { div, svg } from "gpui-kit";

export const TILT_SIZES = new Set(["734x240", "364x168", "287x168", "255x168", "687x162", "180x168"]);

export function tiltBack([w, h]) {
  const key = `${w}x${h}`;
  if (!TILT_SIZES.has(key)) return null;
  return svg(`mods/prts/slant-${key}.svg`).absolute().left(0).top(-12).w(w + 12).h(h + 21).text_color("#a9cde6");
}
