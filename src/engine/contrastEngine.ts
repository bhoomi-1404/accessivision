export type RGBA = [number, number, number, number];

const NAMED_COLORS: Record<string, RGBA> = {
  white: [255, 255, 255, 1],
  black: [0, 0, 0, 1],
  transparent: [0, 0, 0, 0],
  red: [239, 68, 68, 1],
  blue: [59, 130, 246, 1],
  green: [34, 197, 94, 1],
  gray: [128, 128, 128, 1],
  grey: [128, 128, 128, 1],
};

export function parseCssColor(input: string): RGBA | null {
  if (!input) return null;
  const str = input.trim().toLowerCase();
  if (NAMED_COLORS[str]) return [...NAMED_COLORS[str]];

  // Hex #rgb, #rgba, #rrggbb, #rrggbbaa
  if (str.startsWith('#')) {
    const hex = str.slice(1);
    if (hex.length === 3) {
      return [
        parseInt(hex[0] + hex[0], 16),
        parseInt(hex[1] + hex[1], 16),
        parseInt(hex[2] + hex[2], 16),
        1,
      ];
    }
    if (hex.length === 6) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
        1,
      ];
    }
    if (hex.length === 8) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
         +(parseInt(hex.slice(6, 8), 16) / 255).toFixed(3),
      ];
    }
  }

  // rgb() / rgba()
  const rgbMatch = str.match(
    /rgba?\(\s*(\d+)\s*[, ]\s*(\d+)\s*[, ]\s*(\d+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)/
  );
  if (rgbMatch) {
    const r = Math.min(255, Math.max(0, parseInt(rgbMatch[1], 10)));
    const g = Math.min(255, Math.max(0, parseInt(rgbMatch[2], 10)));
    const b = Math.min(255, Math.max(0, parseInt(rgbMatch[3], 10)));
    let a = 1;
    if (rgbMatch[4] !== undefined) {
      a = rgbMatch[4].endsWith('%')
        ? parseFloat(rgbMatch[4]) / 100
        : parseFloat(rgbMatch[4]);
    }
    return [r, g, b, Math.min(1, Math.max(0, a))];
  }

  return null;
}

/**
 * Extracts all color stops from a CSS linear-gradient or radial-gradient string
 */
export function extractGradientColorStops(backgroundImageCss: string): RGBA[] {
  if (!backgroundImageCss || backgroundImageCss === 'none') return [];
  const stops: RGBA[] = [];

  const rgbaRegex = /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)/gi;
  const hexRegex = /#[0-9a-f]{3,8}\b/gi;

  const rgbaMatches = backgroundImageCss.match(rgbaRegex) || [];
  for (const m of rgbaMatches) {
    const parsed = parseCssColor(m);
    if (parsed) stops.push(parsed);
  }

  const hexMatches = backgroundImageCss.match(hexRegex) || [];
  for (const m of hexMatches) {
    const parsed = parseCssColor(m);
    if (parsed) stops.push(parsed);
  }

  return stops;
}

/**
 * Alpha-composites foreground RGBA over background RGBA
 */
export function compositeRgba(fg: RGBA, bg: RGBA): RGBA {
  const alphaFg = fg[3];
  const alphaBg = bg[3];
  const outAlpha = alphaFg + alphaBg * (1 - alphaFg);
  if (outAlpha === 0) return [255, 255, 255, 1];

  const r = Math.round((fg[0] * alphaFg + bg[0] * alphaBg * (1 - alphaFg)) / outAlpha);
  const g = Math.round((fg[1] * alphaFg + bg[1] * alphaBg * (1 - alphaFg)) / outAlpha);
  const b = Math.round((fg[2] * alphaFg + bg[2] * alphaBg * (1 - alphaFg)) / outAlpha);

  return [r, g, b, +outAlpha.toFixed(3)];
}

export function rgbaToHex(rgba: RGBA): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(rgba[0])}${toHex(rgba[1])}${toHex(rgba[2])}`.toUpperCase();
}

/**
 * WCAG 2.1 Relative Luminance
 */
export function getRelativeLuminance(rgba: RGBA): number {
  const transform = (channel: number) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const r = transform(rgba[0]);
  const g = transform(rgba[1]);
  const b = transform(rgba[2]);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * WCAG 2.1 Contrast Ratio (1.0 to 21.0)
 */
export function calculateWcag21Ratio(fg: RGBA, bg: RGBA): number {
  const lum1 = getRelativeLuminance(fg);
  const lum2 = getRelativeLuminance(bg);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return +((brightest + 0.05) / (darkest + 0.05)).toFixed(2);
}

/**
 * WCAG 3.0 Draft APCA (Accessible Perceptual Contrast Algorithm) Lc Value
 * Polarity-sensitive perceptual lightness contrast (-108 to +106)
 */
export function calculateApcaLc(textRgba: RGBA, bgRgba: RGBA): number {
  const mainTRC = 2.4;
  const sRco = 0.2126729;
  const sGco = 0.7151522;
  const sBco = 0.072175;

  const normBG = 0.56;
  const normTXT = 0.57;
  const revTXT = 0.62;
  const revBG = 0.65;

  const blkThrs = 0.022;
  const blkClmp = 1.414;
  const scaleBoW = 1.14;
  const scaleWoB = 1.14;
  const loBoWoffset = 0.027;
  const loWoBoffset = 0.027;
  const loClip = 0.1;

  const softClamp = (y: number) =>
    y >= blkThrs ? y : y + Math.pow(blkThrs - y, blkClmp);

  const sRgbToY = (rgba: RGBA) => {
    const r = Math.pow(rgba[0] / 255, mainTRC);
    const g = Math.pow(rgba[1] / 255, mainTRC);
    const b = Math.pow(rgba[2] / 255, mainTRC);
    return softClamp(r * sRco + g * sGco + b * sBco);
  };

  const yTxt = sRgbToY(textRgba);
  const yBg = sRgbToY(bgRgba);

  if (Math.abs(yBg - yTxt) < 0.0005) return 0;

  let sapc = 0;
  let outputContrast = 0;

  if (yBg > yTxt) {
    // Dark text on light background (Positive polarity)
    sapc = (Math.pow(yBg, normBG) - Math.pow(yTxt, normTXT)) * scaleBoW;
    outputContrast = sapc < loClip ? 0 : sapc - loBoWoffset;
  } else {
    // Light text on dark background (Negative polarity)
    sapc = (Math.pow(yBg, revBG) - Math.pow(yTxt, revTXT)) * scaleWoB;
    outputContrast = sapc > -loClip ? 0 : sapc + loWoBoffset;
  }

  return +(outputContrast * 100).toFixed(1);
}

/**
 * Recommends an accessible foreground color that satisfies target WCAG 2.1 ratio (e.g. 4.5 or 3.0)
 * by progressively lightening or darkening the foreground color.
 */
export function suggestAccessibleForeground(
  fg: RGBA,
  bg: RGBA,
  targetRatio = 4.6
): string {
  const bgLum = getRelativeLuminance(bg);
  // In WCAG 2.1, max contrast with white (lum 1.0) is (1.05) / (bgLum + 0.05).
  // If this max contrast < targetRatio (e.g. for any bgLum > 0.18 with target 4.6),
  // lightening text CANNOT achieve targetRatio. We MUST darken text.
  const maxLightRatio = +((1.05) / (bgLum + 0.05)).toFixed(2);
  const maxDarkRatio = +((bgLum + 0.05) / 0.05).toFixed(2);

  const fgLum = getRelativeLuminance(fg);
  let shouldLighten = maxLightRatio >= targetRatio && (fgLum >= 0.5 || maxDarkRatio < targetRatio);
  if (shouldLighten && maxLightRatio < targetRatio) {
    shouldLighten = false;
  } else if (!shouldLighten && maxDarkRatio < targetRatio) {
    shouldLighten = true;
  }

  // Phase 1: Progressively scale original foreground in chosen direction
  for (let step = 1; step <= 100; step++) {
    const factor = step / 100;
    const candidate: RGBA = shouldLighten
      ? [
          Math.round(fg[0] + (255 - fg[0]) * factor),
          Math.round(fg[1] + (255 - fg[1]) * factor),
          Math.round(fg[2] + (255 - fg[2]) * factor),
          1,
        ]
      : [
          Math.round(fg[0] * (1 - factor)),
          Math.round(fg[1] * (1 - factor)),
          Math.round(fg[2] * (1 - factor)),
          1,
        ];

    const ratio = calculateWcag21Ratio(candidate, bg);
    if (ratio >= targetRatio) {
      return rgbaToHex(candidate);
    }
  }

  // Phase 2: If scaling from original foreground fails (e.g. fg was pure white on mid-tone orange),
  // test curated accessible neutrals in the viable direction:
  const darkNeutrals: RGBA[] = [
    [15, 23, 42, 1],   // slate-900 #0F172A
    [24, 24, 27, 1],   // zinc-900 #18181B
    [0, 0, 0, 1],      // pure black #000000
  ];
  const lightNeutrals: RGBA[] = [
    [255, 255, 255, 1], // pure white #FFFFFF
    [248, 250, 252, 1], // slate-50 #F8FAFC
  ];

  const candidateNeutrals = shouldLighten
    ? [...lightNeutrals, ...darkNeutrals]
    : [...darkNeutrals, ...lightNeutrals];

  for (const n of candidateNeutrals) {
    if (calculateWcag21Ratio(n, bg) >= targetRatio) {
      return rgbaToHex(n);
    }
  }

  // Phase 3: Absolute fallback to the neutral with maximum possible contrast against bg
  const whiteRatio = calculateWcag21Ratio([255, 255, 255, 1], bg);
  const blackRatio = calculateWcag21Ratio([0, 0, 0, 1], bg);
  return whiteRatio >= blackRatio ? '#FFFFFF' : '#0F172A';
}

export function suggestAccessibleBackground(
  fg: RGBA,
  bg: RGBA,
  targetRatio = 4.6
): string {
  const fgLum = getRelativeLuminance(fg);
  const maxDarkBgRatio = +((fgLum + 0.05) / 0.05).toFixed(2);
  const maxLightBgRatio = +((1.05) / (fgLum + 0.05)).toFixed(2);

  // If text is light (fgLum >= 0.18), darken the background; otherwise lighten
  let shouldDarkenBg = maxDarkBgRatio >= targetRatio && (fgLum >= 0.18 || maxLightBgRatio < targetRatio);
  if (shouldDarkenBg && maxDarkBgRatio < targetRatio) {
    shouldDarkenBg = false;
  } else if (!shouldDarkenBg && maxLightBgRatio < targetRatio) {
    shouldDarkenBg = true;
  }

  // Phase 1: Progressively scale existing background to preserve brand hue/saturation
  for (let step = 1; step <= 100; step++) {
    const factor = step / 100;
    const candidate: RGBA = shouldDarkenBg
      ? [
          Math.round(bg[0] * (1 - factor)),
          Math.round(bg[1] * (1 - factor)),
          Math.round(bg[2] * (1 - factor)),
          1,
        ]
      : [
          Math.round(bg[0] + (255 - bg[0]) * factor),
          Math.round(bg[1] + (255 - bg[1]) * factor),
          Math.round(bg[2] + (255 - bg[2]) * factor),
          1,
        ];

    if (calculateWcag21Ratio(fg, candidate) >= targetRatio) {
      return rgbaToHex(candidate);
    }
  }

  // Phase 2: Neutrals fallback if hue-scaling is insufficient
  const darkNeutrals: RGBA[] = [
    [15, 23, 42, 1],
    [0, 0, 0, 1],
  ];
  const lightNeutrals: RGBA[] = [
    [255, 255, 255, 1],
    [248, 250, 252, 1],
  ];

  const candidateNeutrals = shouldDarkenBg
    ? [...darkNeutrals, ...lightNeutrals]
    : [...lightNeutrals, ...darkNeutrals];

  for (const n of candidateNeutrals) {
    if (calculateWcag21Ratio(fg, n) >= targetRatio) {
      return rgbaToHex(n);
    }
  }

  const whiteRatio = calculateWcag21Ratio(fg, [255, 255, 255, 1]);
  const blackRatio = calculateWcag21Ratio(fg, [0, 0, 0, 1]);
  return whiteRatio >= blackRatio ? '#FFFFFF' : '#0F172A';
}
