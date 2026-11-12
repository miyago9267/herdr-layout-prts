// PRTS notifications: every notify() and Herdr's own toasts, drawn like the layout's "前往上一次作戰" card.
// A dark strip (blinking diamond + kind) over a paper slab (title + body), sliding in from the right.
// Click runs the toast's action and dismisses it. Picked by the layout root's "toast": "prts-toast".

import { View, div, svg } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { props, closeOverlay, run } from "herdr";

const ZH = "Hiragino Sans W8";
const MONO = "Geist Mono";
const INK = "#14171b";
const PAPER = "#ecebe7f0";
const PAPER_HOVER = "#f6f5f1f6";
const KIND = {
  error: { zh: "警報", en: "ALERT", color: "#e2292e", period: 700 },
  warning: { zh: "注意", en: "CAUTION", color: "#f0801f", period: 1100 },
  success: { zh: "行動完成", en: "COMPLETE", color: "#86b22d", period: 2400 },
  info: { zh: "PRTS 通知", en: "NOTICE", color: "#4fc3f7", period: 2000 },
};

export default class PrtsToast extends View {
  init(_p, cx) {
    this.on = false;
    cx.timer.after(20, (cx) => { this.on = true; cx.notify(); });
  }

  render() {
    const p = props() ?? {};
    const k = KIND[p.level] ?? KIND.info;
    const login = /^([a-z0-9][a-z0-9_.-]{0,31}) needs login; run hc machine login \1$/.exec(p.body ?? "");
    const command = login ? `hc machine login ${login[1]}` : null;
    return div().id("toast").size_full().relative().overflow_hidden().cursor_pointer()
      .on_click(() => { if (p.action?.name) run(p.action.name, p.action.args ?? {}); closeOverlay(p.overlay); })
      .child(v_flex().absolute().top(0).left(this.on ? 0 : 60).size_full()
        .opacity(this.on ? 1 : 0)
        .transition("left", { duration: 260, easing: "ease-out" }).transition("opacity", { duration: 220, easing: "ease-out" })
        .child(h_flex().h(22).flex_none().px(10).items_center().gap(6).bg("#14171bf2")
          .child(svg("mods/prts/diamond.svg").size(9).text_color(k.color).loop("opacity", { from: 0.35, to: 1, period: k.period }))
          .child(div().font_family(ZH).text_size(12).text_color("#ffffffdd").child(k.zh))
          .child(div().flex_1())
          .child(div().font_family(MONO).text_size(10).text_color("#ffffff66").child(k.en)))
        .child(v_flex().flex_1().min_h(0).px(10).justify_center().gap(2).bg(PAPER).hover((s) => s.bg(PAPER_HOVER))
          .border_l(3).border_color(k.color)
          .child(div().truncate().font_family(ZH).text_size(15).text_color(INK).child(login ? `${login[1]} 需要登入` : p.title ?? ""))
          .when(!login && Boolean(p.body), (el) => el.child(div().truncate().text_size(12).text_color("#4a4f56").child(p.body ?? "")))
          .when(Boolean(login), (el) => el.child(h_flex().gap(8).items_center()
            .child(div().flex_1().min_w(0).truncate().font_family(MONO).text_size(12).text_color("#4a4f56").child(command))
            .child(div().id("toast-login-copy").flex_none().px(6).py(2).bg(INK).font_family(MONO).text_size(11).text_color("#ffffff")
              .on_click((_e, cx) => { cx.stop_propagation(); cx.write_to_clipboard(command); this.copied = true; cx.notify(); })
              .child(this.copied ? "COPIED" : "COPY"))))));
  }
}
