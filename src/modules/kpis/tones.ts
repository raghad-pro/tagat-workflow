import type { CSSProperties } from "react";

/**
 * The KPI page's accent system.
 *
 * Every coloured thing on the page — an icon tile, a trend chip, a status
 * pill, a chart series — picks a tone by name and takes its ink and its tint
 * from here. Nothing states a hex code of its own.
 *
 * The tints are `color-mix` against `transparent` rather than baked pastels.
 * That is the whole reason dark mode works: a translucent wash sits on
 * whatever card it lands on, where `#E6F6FE` stayed a near-white block on a
 * near-black card. The hue itself is a token, restated once per theme.
 */

export type KpiTone = "sky" | "violet" | "green" | "red" | "amber" | "brand" | "slate";

const HUE: Record<KpiTone, string> = {
  sky: "var(--kpi-sky)",
  violet: "var(--kpi-violet)",
  green: "var(--kpi-green)",
  red: "var(--kpi-red)",
  amber: "var(--kpi-amber)",
  brand: "var(--kpi-brand)",
  slate: "var(--kpi-slate)",
};

/** The tone's ink: icon glyphs, figures, chip text. */
export const toneInk = (tone: KpiTone): string => HUE[tone];

/** A wash to sit a glyph or a figure on. `strength` is a percentage. */
export const toneWash = (tone: KpiTone, strength = 14): string =>
  `color-mix(in srgb, ${HUE[tone]} ${strength}%, transparent)`;

/** A hairline in the tone, for a wash that needs an edge to read as a surface. */
export const toneEdge = (tone: KpiTone, strength = 22): string =>
  `color-mix(in srgb, ${HUE[tone]} ${strength}%, transparent)`;

/** Ink plus wash plus edge, ready to spread onto a tile. */
export function toneSurface(tone: KpiTone, strength = 14): CSSProperties {
  return {
    color: toneInk(tone),
    backgroundColor: toneWash(tone, strength),
    border: `1px solid ${toneEdge(tone)}`,
  };
}

/**
 * The one card surface on the page.
 *
 * Border and shadow were previously written out at each call site with
 * slightly different numbers, which is what made the page look assembled
 * rather than designed. The shadow is a tight contact edge plus a wide soft
 * lift, deepened for dark where a light shadow does not read at all.
 */
export const KPI_CARD =
  "ds-bg-form rounded-xl border border-[color:var(--color-border-form)] " +
  "shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_-16px_rgba(15,23,42,0.18)] " +
  "dark:shadow-[0_1px_2px_rgba(0,0,0,0.45),0_12px_34px_-18px_rgba(0,0,0,0.75)]";

/**
 * Black or white, whichever stays readable on `hex`.
 *
 * The donut slices are fixed vivid colours, so a label sitting on one cannot
 * take its colour from the theme — it has to take it from the slice. This is
 * the WCAG relative-luminance test, which is why yellow gets dark ink and
 * blue gets light, rather than one hardcoded choice with a text-shadow
 * papering over the other case.
 */
export function readableInk(hex: string): string {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return "#0f172a";
  const packed = parseInt(match[1], 16);
  const [r, g, b] = [(packed >> 16) & 255, (packed >> 8) & 255, packed & 255].map((channel) => {
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.42 ? "#0f172a" : "#ffffff";
}
