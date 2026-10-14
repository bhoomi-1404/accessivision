import {
  A11yIssue,
  A11yTreeNode,
  BoundingBox,
  ContrastNodeReport,
  FocusStop,
  ScreenReaderAnnouncement,
} from '../types/a11y';
import {
  calculateApcaLc,
  calculateWcag21Ratio,
  compositeRgba,
  extractGradientColorStops,
  parseCssColor,
   RGBA,
  rgbaToHex,
  suggestAccessibleBackground,
  suggestAccessibleForeground,
} from './contrastEngine';

const IMPLICIT_ROLES: Record<string, string> = {
  button: 'button',
  a: 'link',
  nav: 'navigation',
  main: 'main',
  header: 'banner',
  footer: 'contentinfo',
  aside: 'complementary',
  section: 'region',
  form: 'form',
  ul: 'list',
  ol: 'list',
  li: 'listitem',
  table: 'table',
  dialog: 'dialog',
  select: 'combobox',
  textarea: 'textbox',
  img: 'img',
  h1: 'heading',
  h2: 'heading',
  h3: 'heading',
  h4: 'heading',
  h5: 'heading',
  h6: 'heading',
};

export function computeAriaRole(el: Element): string {
  const explicit = el.getAttribute('role');
  if (explicit) return explicit.trim().split(/\s+/)[0];

  const tag = el.tagName.toLowerCase();
  if (tag === 'input') {
    const type = (el.getAttribute('type') || 'text').toLowerCase();
    if (type === 'checkbox') return 'checkbox';
    if (type === 'radio') return 'radio';
    if (type === 'button' || type === 'submit' || type === 'reset') return 'button';
    if (type === 'search') return 'searchbox';
    if (type === 'range') return 'slider';
    return 'textbox';
  }
  if (tag === 'a' && !el.hasAttribute('href')) return 'generic';
  return IMPLICIT_ROLES[tag] || 'generic';
}

export function computeAccessibleName(el: Element, doc: Document): string {
  // 1. aria-labelledby
  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy) {
    const parts = labelledBy
      .split(/\s+/)
      .map((id) => doc.getElementById(id)?.textContent?.trim() || '')
      .filter(Boolean);
    if (parts.length > 0) return parts.join(' ');
  }

  // 2. aria-label
  const ariaLabel = el.getAttribute('aria-label')?.trim();
  if (ariaLabel) return ariaLabel;

  const tag = el.tagName.toLowerCase();

  // 3. Associated <label for="id"> or ancestor <label>
  if (tag === 'input' || tag === 'select' || tag === 'textarea') {
    const id = el.getAttribute('id');
    if (id) {
      const labelEl = doc.querySelector(`label[for="${CSS.escape(id)}"]`);
      if (labelEl?.textContent?.trim()) {
        return labelEl.textContent.trim();
      }
    }
    const parentLabel = el.closest('label');
    if (parentLabel?.textContent?.trim()) {
      return parentLabel.textContent.trim();
    }
    const placeholder = el.getAttribute('placeholder')?.trim();
    if (placeholder) return `${placeholder} (from placeholder only)`;
  }

  // 4. Image alt
  if (tag === 'img') {
    const alt = el.getAttribute('alt');
    if (alt !== null) return alt.trim() || '(decorative empty alt)';
    return '';
  }

  // 5. Text content for buttons, links, headings, etc.
  if (
    ['button', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'label', 'summary'].includes(
      tag
    ) ||
    el.hasAttribute('role')
  ) {
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (text) return text.slice(0, 80);
  }

  // 6. title fallback
  const title = el.getAttribute('title')?.trim();
  if (title) return title;

  return '';
}

function getElementRect(el: Element, win: Window): BoundingBox {
  const r = el.getBoundingClientRect();
  return {
    top: Math.round(r.top + win.scrollY),
    left: Math.round(r.left + win.scrollX),
    width: Math.round(r.width),
    height: Math.round(r.height),
  };
}

function isElementVisible(el: Element, win: Window): boolean {
  const style = win.getComputedStyle(el);
  if (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    parseFloat(style.opacity) === 0
  ) {
    return false;
  }
  const r = el.getBoundingClientRect();
  return r.width > 1 && r.height > 1;
}

export function ensureElementSelectors(doc: Document): void {
  let counter = 1;
  const all = doc.body.querySelectorAll('*');
  all.forEach((el) => {
    if (!el.getAttribute('data-av-id')) {
      el.setAttribute('data-av-id', `av-node-${counter++}`);
    }
  });
}

export function getAvSelector(el: Element): string {
  const avId = el.getAttribute('data-av-id');
  if (avId) return `[data-av-id="${avId}"]`;
  if (el.id) return `#${el.id}`;
  return el.tagName.toLowerCase();
}

export function formatFriendlyTag(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : '';
  const cls =
    typeof el.className === 'string' && el.className.trim()
      ? '.' +
        el.className
          .trim()
          .split(/\s+/)
          .filter((c) => !c.startsWith('av-'))
          .slice(0, 2)
          .join('.')
      : '';
  return `<${tag}${id}${cls}>`;
}

function serializeElementShallow(el: Element): string {
  const clone = el.cloneNode(true) as Element;
  clone.removeAttribute('data-av-id');
  clone.removeAttribute('data-av-patched');
  const html = clone.outerHTML;
  if (html.length <= 220) return html;
  const openTagMatch = html.match(/^<[^>]+>/);
  const openTag = openTagMatch ? openTagMatch[0] : `<${el.tagName.toLowerCase()}>`;
  const innerText = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50);
  return `${openTag}${innerText ? innerText + '...' : ''}</${el.tagName.toLowerCase()}>`;
}

function htmlToJsx(html: string): string {
  return html
    .replace(/\bclass=/g, 'className=')
    .replace(/\bfor=/g, 'htmlFor=')
    .replace(/\btabindex=/g, 'tabIndex=')
    .replace(/\bautocomplete=/g, 'autoComplete=');
}

/**
 * Resolves effective background RGBA and checks if any ancestor uses a CSS gradient or background image
 */
function resolveBackgroundData(
  el: Element,
  win: Window
): {
  compositedBg: RGBA;
  isGradientOrImage: boolean;
  rawBgCss: string;
  gradientStops: RGBA[];
} {
  const layers: RGBA[] = [];
  let isGradientOrImage = false;
  let rawBgCss = '';
  let gradientStops: RGBA[] = [];

  let curr: Element | null = el;
  while (curr) {
    const style = win.getComputedStyle(curr);
    const bgImg = style.backgroundImage;
    if (bgImg && bgImg !== 'none') {
      isGradientOrImage = true;
      if (!rawBgCss) rawBgCss = bgImg;
      const stops = extractGradientColorStops(bgImg);
      if (stops.length > 0 && gradientStops.length === 0) {
        gradientStops = stops;
      }
    }

    const bgCol = parseCssColor(style.backgroundColor);
    if (bgCol && bgCol[3] > 0) {
      layers.push(bgCol);
      if (bgCol[3] >= 0.99) break;
    }
    curr = curr.parentElement;
  }

  // Default page canvas backdrop: check body and html background
  const htmlStyle = win.getComputedStyle(win.document.documentElement);
  const htmlBg = parseCssColor(htmlStyle.backgroundColor);
  const bodyStyle = win.document.body ? win.getComputedStyle(win.document.body) : null;
  const bodyBg = bodyStyle ? parseCssColor(bodyStyle.backgroundColor) : null;

  let currentBg: RGBA =
    bodyBg && bodyBg[3] > 0
      ? bodyBg
      : htmlBg && htmlBg[3] > 0
      ? htmlBg
      : [255, 255, 255, 1];

  for (let i = layers.length - 1; i >= 0; i--) {
    currentBg = compositeRgba(layers[i], currentBg);
  }

  // If gradient stops exist and backgroundColor was transparent, average the gradient stops for primary bg
  if (gradientStops.length > 0 && layers.length === 0) {
    const avgR = Math.round(
      gradientStops.reduce((acc, s) => acc + s[0], 0) / gradientStops.length
    );
    const avgG = Math.round(
      gradientStops.reduce((acc, s) => acc + s[1], 0) / gradientStops.length
    );
    const avgB = Math.round(
      gradientStops.reduce((acc, s) => acc + s[2], 0) / gradientStops.length
    );
    currentBg = [avgR, avgG, avgB, 1];
  }

  return {
    compositedBg: currentBg,
    isGradientOrImage,
    rawBgCss,
    gradientStops,
  };
}

/**
 * Builds the ordered keyboard Focus Map with spatial jump & modal trap analysis
 */
export function buildFocusMap(doc: Document): FocusStop[] {
  const win = doc.defaultView;
  if (!win) return [];

  const candidateSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]',
    '[contenteditable="true"]',
  ].join(',');

  const rawCandidates = Array.from(doc.body.querySelectorAll(candidateSelector));
  const activeModal = doc.body.querySelector(
    '[data-modal-active="true"], [aria-modal="true"], .av-SimulatedModal[ data-open="true" ]'
  );

  interface IndexedCandidate {
    el: Element;
    domOrder: number;
    rawTabAttr: number | null;
    effectiveTab: number;
  }

  const validCandidates: IndexedCandidate[] = [];

  rawCandidates.forEach((el, idx) => {
    if (!isElementVisible(el, win)) return;
    const tabAttrStr = el.getAttribute('tabindex');
    const rawTabAttr = tabAttrStr !== null ? parseInt(tabAttrStr, 10) : null;
    if (rawTabAttr !== null && rawTabAttr < 0) return; // tabindex="-1" skipped in sequential tabbing

    validCandidates.push({
      el,
      domOrder: idx,
      rawTabAttr,
      effectiveTab: rawTabAttr !== null && !isNaN(rawTabAttr) ? rawTabAttr : 0,
    });
  });

  // Sort according to HTML spec sequential focus navigation order:
  // 1. Positive tabindex values in ascending order
  // 2. tabindex=0 / natural focusables in DOM order
  validCandidates.sort((a, b) => {
    if (a.effectiveTab > 0 && b.effectiveTab > 0) {
      return a.effectiveTab - b.effectiveTab || a.domOrder - b.domOrder;
    }
    if (a.effectiveTab > 0) return -1;
    if (b.effectiveTab > 0) return 1;
    return a.domOrder - b.domOrder;
  });

  const stops: FocusStop[] = [];

  validCandidates.forEach((item, index) => {
    const { el, rawTabAttr, effectiveTab } = item;
    const rect = getElementRect(el, win);
    const style = win.getComputedStyle(el);
    const accessibleName = computeAccessibleName(el, doc);
    const role = computeAriaRole(el);

    const outlineStyle = style.outlineStyle;
    const outlineWidth = parseFloat(style.outlineWidth || '0');
    const ExplicitNoFocus =
      el.hasAttribute('data-no-focus-ring') ||
      (outlineStyle === 'none' && el.getAttribute('style')?.includes('outline: none'));

    const hasFocusRing = !ExplicitNoFocus && !(outlineStyle === 'none' && outlineWidth === 0 && el.classList.contains('focus-none'));

    let distanceFromPrev = 0;
    let isVisualOrderMismatch = false;
    if (index > 0) {
      const prevRect = stops[index - 1].rect;
      const dx = rect.left - prevRect.left;
      const dy = rect.top - prevRect.top;
      distanceFromPrev = Math.round(Math.hypot(dx, dy));

      // Flag visual jump backwards (e.g., jumping > 95px upward in the viewport)
      if (dy < -95 || (Math.abs(dy) < 24 && dx < -180)) {
        isVisualOrderMismatch = true;
      }
    }

    // Check if there is an open modal trap violation
    const isInsideModalTrap = Boolean(
      (activeModal && !activeModal.contains(el)) ||
        el.hasAttribute('data-focus-trap-bug')
    );

    stops.push({
      index: index + 1,
      selector: getAvSelector(el),
      tagName: el.tagName.toLowerCase(),
      role,
      accessibleName: accessibleName || '(Unlabeled Focusable)',
      rawTabIndex: rawTabAttr,
      effectiveTabIndex: effectiveTab,
      rect,
      hasFocusRing,
      isPositiveTabIndexAnomaly: effectiveTab > 0,
      isVisualOrderMismatch,
      isInsideModalTrap,
      isMissingAccessibleName: !accessibleName.trim(),
      distanceFromPrev,
    });
  });

  return stops;
}

/**
 * Inspects all visible text-bearing elements for WCAG 2.1 AA/AAA + WCAG 3.0 APCA contrast,
 * including multi-stop CSS gradients.
 */
export function analyzeContrastNodes(doc: Document): ContrastNodeReport[] {
  const win = doc.defaultView;
  if (!win) return [];

  const reports: ContrastNodeReport[] = [];
  const textTags = doc.body.querySelectorAll(
    'h1, h2, h3, h4, h5, h6, p, a, button, label, span, li, th, td, small, div'
  );

  textTags.forEach((el, idx) => {
    if (!isElementVisible(el, win)) return;

    // Only inspect leaf text elements or elements with direct text nodes
    const directText = Array.from(el.childNodes)
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent?.trim() || '')
      .join(' ')
      .trim();

    if (!directText || directText.length < 2) return;

    const style = win.getComputedStyle(el);
    const fgParsed = parseCssColor(style.color) || [15, 23, 42, 1];
    const { compositedBg, isGradientOrImage, rawBgCss, gradientStops } =
      resolveBackgroundData(el, win);

    const effectiveFg = compositeRgba(fgParsed, compositedBg);
    const wcag21Ratio = calculateWcag21Ratio(effectiveFg, compositedBg);
    const apcaLc = calculateApcaLc(effectiveFg, compositedBg);

    let worstGradientRatio: number | undefined;
    let worstGradientBgHex: string | undefined;

    if (gradientStops.length > 0) {
      let minRatio = wcag21Ratio;
      let worstStop = compositedBg;
      for (const stop of gradientStops) {
        const stopComposited = compositeRgba(stop, compositedBg);
        const r = calculateWcag21Ratio(effectiveFg, stopComposited);
        if (r < minRatio) {
          minRatio = r;
          worstStop = stopComposited;
        }
      }
      worstGradientRatio = minRatio;
      worstGradientBgHex = rgbaToHex(worstStop);
    }

    const fontSizePx = parseFloat(style.fontSize || '16');
    const fontWeight = parseInt(style.fontWeight || '400', 10) || 400;
    const isLargeText =
      fontSizePx >= 24 || (fontSizePx >= 18.66 && fontWeight >= 700);

    const effectiveRatio =
      worstGradientRatio !== undefined
        ? Math.min(wcag21Ratio, worstGradientRatio)
        : wcag21Ratio;

    const aaThreshold = isLargeText ? 3.0 : 4.5;
    const aaaThreshold = isLargeText ? 4.5 : 7.0;
    const apcaThreshold = isLargeText ? 45 : 60;

    const passesAA = effectiveRatio >= aaThreshold;
    const passesAAA = effectiveRatio >= aaaThreshold;
    const passesApca = Math.abs(apcaLc) >= apcaThreshold;

    const targetBgForSuggestion =
      worstGradientBgHex && parseCssColor(worstGradientBgHex)
        ? (parseCssColor(worstGradientBgHex) as RGBA)
        : compositedBg;

    const suggestedFgHex = passesAA
      ? rgbaToHex(effectiveFg)
      : suggestAccessibleForeground(effectiveFg, targetBgForSuggestion, aaThreshold + 0.3);

    const suggestedBgHex = passesAA
      ? rgbaToHex(compositedBg)
      : suggestAccessibleBackground(effectiveFg, targetBgForSuggestion, aaThreshold + 0.3);

    const beforeHtml = serializeElementShallow(el);
    const cloneFg = el.cloneNode(true) as HTMLElement;
    cloneFg.style.color = suggestedFgHex;
    const afterHtmlFg = serializeElementShallow(cloneFg);

    const cloneBg = el.cloneNode(true) as HTMLElement;
    cloneBg.style.backgroundColor = suggestedBgHex;
    cloneBg.style.backgroundImage = 'none';
    const afterHtmlBg = serializeElementShallow(cloneBg);

    const currentFgStr = rgbaToHex(effectiveFg);
    const currentBgStr = worstGradientBgHex || rgbaToHex(compositedBg);

    const cssCurrent = `color: ${currentFgStr};\nbackground-color: ${currentBgStr};`;
    const cssSuggestedFg = `color: ${suggestedFgHex}; /* accessible text */\nbackground-color: ${currentBgStr};`;
    const cssSuggestedBg = `color: ${currentFgStr};\nbackground-color: ${suggestedBgHex}; /* accessible background */`;

    const explanation = !passesAA
      ? `Text (${currentFgStr}) on background (${currentBgStr}) achieves ${effectiveRatio}:1 contrast, failing the WCAG AA requirement of ≥ ${aaThreshold}:1 for ${
          isLargeText ? 'large text (≥18pt or ≥14pt bold)' : 'normal text (<18pt)'
        }.`
      : `Passes WCAG AA standard (${effectiveRatio}:1 ≥ ${aaThreshold}:1).`;

    reports.push({
      id: `contrast-${idx}-${getAvSelector(el)}`,
      selector: getAvSelector(el),
      tagName: el.tagName.toLowerCase(),
      textPreview: directText.slice(0, 64),
      fontSizePx: Math.round(fontSizePx),
      fontWeight,
      isLargeText,
      fgHex: rgbaToHex(effectiveFg),
      fgRgba: effectiveFg,
      bgHex: rgbaToHex(compositedBg),
      bgRgba: compositedBg,
      worstGradientBgHex,
      isDynamicGradientOrImage: isGradientOrImage,
      rawBackgroundStyle: rawBgCss || style.backgroundColor,
      wcag21Ratio,
      worstGradientRatio,
      passesAA,
      passesAAA,
      apcaLc,
      passesApca,
      suggestedFgHex,
      suggestedBgHex,
      rect: getElementRect(el, win),
      isPatched: el.getAttribute('data-av-patched') === 'true',
      beforeHtml,
      afterHtmlFg,
      afterHtmlBg,
      cssCurrent,
      cssSuggestedFg,
      cssSuggestedBg,
      explanation,
    });
  });

  return reports;
}

/**
 * Builds the hierarchical Screen Reader Accessibility Tree & initial Virtual Buffer
 */
export function buildAccessibilityTree(doc: Document): A11yTreeNode[] {
  const win = doc.defaultView;
  if (!win) return [];

  const semanticSelectors =
    'header, nav, main, section, aside, footer, form, dialog, h1, h2, h3, h4, h5, h6, button, a, input, select, textarea, img, [role], [aria-live]';

  const elements = Array.from(doc.body.querySelectorAll(semanticSelectors)).filter((el) =>
    isElementVisible(el, win)
  );

  const nodes: A11yTreeNode[] = elements.slice(0, 60).map((el, idx) => {
    const role = computeAriaRole(el);
    const accessibleName = computeAccessibleName(el, doc);
    const states: string[] = [];

    if (el.getAttribute('aria-expanded') === 'true') states.push('expanded');
    if (el.getAttribute('aria-expanded') === 'false') states.push('collapsed');
    if (el.getAttribute('aria-checked') === 'true' || (el as HTMLInputElement).checked)
      states.push('checked');
    if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true')
      states.push('disabled');
    if (el.getAttribute('aria-modal') === 'true') states.push('modal');
    if (el.getAttribute('aria-required') === 'true' || el.hasAttribute('required'))
      states.push('required');

    const ariaLiveAttr = el.getAttribute('aria-live');
    const ariaLive: 'off' | 'polite' | 'assertive' =
      ariaLiveAttr === 'assertive'
        ? 'assertive'
        : ariaLiveAttr === 'polite' || role === 'status' || role === 'alert'
        ? 'polite'
        : 'off';

    const tabAttr = el.getAttribute('tabindex');
    const tabIndex = tabAttr !== null ? parseInt(tabAttr, 10) : null;
    const isFocusable =
      ['button', 'a', 'input', 'select', 'textarea'].includes(el.tagName.toLowerCase()) ||
      (tabIndex !== null && tabIndex >= 0);

    const requiresName = [
      'button',
      'link',
      'textbox',
      'checkbox',
      'combobox',
      'img',
      'dialog',
    ].includes(role);

    return {
      id: `a11y-node-${idx}`,
      selector: getAvSelector(el),
      tagName: el.tagName.toLowerCase(),
      role,
      accessibleName,
      states,
      ariaLive,
      tabIndex,
      isFocusable,
      hasMissingName: requiresName && !accessibleName.trim(),
      rect: getElementRect(el, win),
      children: [],
    };
  });

  return nodes;
}

/**
 * Generates realistic VoiceOver (macOS) and NVDA (Windows) spoken strings for any element
 */
export function createScreenReaderAnnouncement(
  el: Element,
  doc: Document,
  politeness: 'focus' | 'polite' | 'assertive' = 'focus'
): ScreenReaderAnnouncement {
  const role = computeAriaRole(el);
  const name = computeAccessibleName(el, doc);
  const tag = el.tagName.toLowerCase();

  let warning: string | undefined;
  if (!name && ['button', 'link', 'textbox', 'img', 'checkbox'].includes(role)) {
    warning = `Critical Screen Reader Failure: Unlabeled <${tag}> announced only as "${role}" with zero context.`;
  } else if (name.includes('(from placeholder only)')) {
    warning = `Fragile Label: Screen readers fall back to placeholder, which disappears once the user types.`;
  }

  const cleanName = name.replace(' (from placeholder only)', '');
  const headingLevel = tag.match(/^h([1-6])$/)?.[1];

  const voiceOverOutput = headingLevel
    ? `Heading level ${headingLevel}, ${cleanName || 'empty heading'}`
    : cleanName
    ? `${cleanName}, ${role}`
    : `Unlabeled ${role}`;

  const nvdaOutput = headingLevel
    ? `${cleanName || 'blank'} heading level ${headingLevel}`
    : cleanName
    ? `${role} ${cleanName}`
    : `${role} unlabeled`;

  return {
    id: `sr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toLocaleTimeString([], {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    politeness,
    selector: getAvSelector(el),
    role,
    accessibleName: cleanName || '(No Accessible Name)',
    voiceOverOutput,
    nvdaOutput,
    warning,
  };
}

/**
 * Full diagnostic pass over the live iframe Document
 */
export function auditLiveDocument(doc: Document): {
  issues: A11yIssue[];
  focusStops: FocusStop[];
  contrastReports: ContrastNodeReport[];
  a11yTree: A11yTreeNode[];
  score: number;
} {
  ensureElementSelectors(doc);
  const win = doc.defaultView;
  if (!win) {
    return { issues: [], focusStops: [], contrastReports: [], a11yTree: [], score: 100 };
  }

  const issues: A11yIssue[] = [];
  const focusStops = buildFocusMap(doc);
  const contrastReports = analyzeContrastNodes(doc);
  const a11yTree = buildAccessibilityTree(doc);

  let issueIdx = 1;

  // 1. Check Interactive Controls Missing Accessible Name (Buttons / Links)
  doc.body.querySelectorAll('button, a[href], [role="button"]').forEach((el) => {
    if (!isElementVisible(el, win)) return;
    const name = computeAccessibleName(el, doc);
    if (!name.trim()) {
      const selector = getAvSelector(el);
      const inferredPurpose =
        el.getAttribute('data-purpose') ||
        (el.innerHTML.includes('cart') || el.innerHTML.includes('shopping')
          ? 'View shopping cart'
          : el.innerHTML.includes('close') || el.innerHTML.includes('×') || el.innerHTML.includes('x')
          ? 'Close dialog'
          : el.innerHTML.includes('bell') || el.innerHTML.includes('notif')
          ? 'Open notifications'
          : el.innerHTML.includes('search')
          ? 'Search catalog'
          : 'Activate action button');

      const beforeHtml = serializeElementShallow(el);
      const clone = el.cloneNode(true) as Element;
      clone.setAttribute('aria-label', inferredPurpose);
      const afterHtml = serializeElementShallow(clone);

      issues.push({
        id: `issue-aria-name-${issueIdx++}`,
        ruleId: 'button-name',
        title: `Interactive ${formatFriendlyTag(el)} missing accessible name`,
        severity: 'critical',
        category: 'semantics-aria',
        wcagCriteria: 'WCAG 4.1.2 Name, Role, Value',
        wcagLevel: 'A',
        selector,
        tagName: el.tagName.toLowerCase(),
        impactSummary:
          'Screen reader users hear only "button" or "link" without knowing what action it performs.',
        aiExplanation: `This icon or graphic control lacks text content or an explicit aria-label. Injecting aria-label="${inferredPurpose}" exposes a clear accessible name to assistive technologies without altering visual layout.`,
        beforeHtml,
        afterHtml,
        afterJsx: htmlToJsx(afterHtml),
        remediation: {
          type: 'set-attribute',
          attribute: 'aria-label',
          value: inferredPurpose,
        },
        rect: getElementRect(el, win),
        isPatched: el.getAttribute('data-av-patched') === 'true',
      });
    }
  });

  // 2. Check Form Inputs Missing Programmatic <label> or aria-label
  doc.body
    .querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea')
    .forEach((el) => {
      if (!isElementVisible(el, win)) return;
      const name = computeAccessibleName(el, doc);
      if (!name || name.includes('(from placeholder only)')) {
        const selector = getAvSelector(el);
        const placeholder = el.getAttribute('placeholder') || 'Enter value';
        const cleanLabel = placeholder.replace(/\.\.\.$/, '');
        const beforeHtml = serializeElementShallow(el);
        const clone = el.cloneNode(true) as Element;
        clone.setAttribute('aria-label', cleanLabel);
        const afterHtml = serializeElementShallow(clone);

        issues.push({
          id: `issue-input-label-${issueIdx++}`,
          ruleId: 'label-association',
          title: `Form control ${formatFriendlyTag(el)} lacks programmatic label`,
          severity: 'serious',
          category: 'semantics-aria',
          wcagCriteria: 'WCAG 1.3.1 & 3.3.2 Labels or Instructions',
          wcagLevel: 'A',
          selector,
          tagName: el.tagName.toLowerCase(),
          impactSummary: name.includes('(from placeholder only)')
            ? 'Relying solely on placeholder text fails once a user enters text and breaks voice control targeting.'
            : 'Form input has no associated <label for="..."> or aria-label.',
          aiExplanation: `Associate a persistent <label> or add aria-label="${cleanLabel}" so screen readers and voice dictation tools ("Click ${cleanLabel}") can bind to this field reliably.`,
          beforeHtml,
          afterHtml,
          afterJsx: htmlToJsx(afterHtml),
          remediation: {
            type: 'set-attribute',
            attribute: 'aria-label',
            value: cleanLabel,
          },
          rect: getElementRect(el, win),
          isPatched: el.getAttribute('data-av-patched') === 'true',
        });
      }
    });

  // 3. Check Non-Semantic Fake Buttons (<div data-fake-button> or <span onclick>)
  doc.body.querySelectorAll('[data-fake-button="true"], div[onclick], span[onclick]').forEach((el) => {
    if (!isElementVisible(el, win)) return;
    const role = el.getAttribute('role');
    const tabIndex = el.getAttribute('tabindex');
    if (role !== 'button' || tabIndex !== '0') {
      const selector = getAvSelector(el);
      const beforeHtml = serializeElementShallow(el);
      const clone = el.cloneNode(true) as Element;
      clone.setAttribute('role', 'button');
      clone.setAttribute('tabindex', '0');
      const afterHtml = serializeElementShallow(clone);

      issues.push({
        id: `issue-fake-btn-${issueIdx++}`,
        ruleId: 'interactive-div-semantics',
        title: `Non-semantic ${formatFriendlyTag(el)} used as interactive button`,
        severity: 'critical',
        category: 'focus-keyboard',
        wcagCriteria: 'WCAG 2.1.1 Keyboard & 4.1.2 Role',
        wcagLevel: 'A',
        selector,
        tagName: el.tagName.toLowerCase(),
        impactSummary:
          'Keyboard users cannot reach this control with Tab or activate it with Enter/Space.',
        aiExplanation:
          'Generic <div> and <span> elements are excluded from the sequential focus order and announce as plain text. Replace with a native <button type="button"> or add role="button" and tabIndex={0} with keyboard event handlers.',
        beforeHtml,
        afterHtml,
        afterJsx: htmlToJsx(afterHtml),
        remediation: {
          type: 'set-attribute',
          attribute: 'role',
          value: 'button',
          secondaryAttribute: 'tabindex',
          secondaryValue: '0',
        },
        rect: getElementRect(el, win),
        isPatched: el.getAttribute('data-av-patched') === 'true',
      });
    }
  });

  // 4. Positive tabindex > 0 Hijacking Focus Order
  focusStops
    .filter((stop) => stop.isPositiveTabIndexAnomaly)
    .forEach((stop) => {
      const el = doc.body.querySelector(stop.selector);
      if (!el) return;
      const beforeHtml = serializeElementShallow(el);
      const clone = el.cloneNode(true) as Element;
      clone.setAttribute('tabindex', '0');
      const afterHtml = serializeElementShallow(clone);

      issues.push({
        id: `issue-tabindex-pos-${issueIdx++}`,
        ruleId: 'tabindex-positive',
        title: `Positive tabindex="${stop.rawTabIndex}" hijacks keyboard focus flow`,
        severity: 'serious',
        category: 'focus-keyboard',
        wcagCriteria: 'WCAG 2.4.3 Focus Order',
        wcagLevel: 'A',
        selector: stop.selector,
        tagName: stop.tagName,
        impactSummary: `Forces focus to jump to Stop #${stop.index} ahead of top-of-page navigation, disorienting keyboard and screen-reader users.`,
        aiExplanation:
          'Using tabindex values greater than 0 overrides natural DOM reading order and creates erratic zig-zag focus paths. Normalize to tabindex="0" so focus follows visual layout order.',
        beforeHtml,
        afterHtml,
        afterJsx: htmlToJsx(afterHtml),
        remediation: {
          type: 'set-attribute',
          attribute: 'tabindex',
          value: '0',
        },
        rect: stop.rect,
        isPatched: el.getAttribute('data-av-patched') === 'true',
      });
    });

  // 5. Missing Keyboard Focus Ring (`[data-no-focus-ring="true"]`)
  doc.body.querySelectorAll('[data-no-focus-ring="true"]').forEach((el) => {
    if (!isElementVisible(el, win)) return;
    const selector = getAvSelector(el);
    const beforeHtml = serializeElementShallow(el);
    const clone = el.cloneNode(true) as Element;
    clone.removeAttribute('data-no-focus-ring');
    clone.setAttribute('data-focus-restored', 'true');
    const afterHtml = serializeElementShallow(clone);

    issues.push({
      id: `issue-focus-visible-${issueIdx++}`,
      ruleId: 'focus-visible-suppressed',
      title: `Focus indicator suppressed on ${formatFriendlyTag(el)} (outline: none)`,
      severity: 'serious',
      category: 'focus-keyboard',
      wcagCriteria: 'WCAG 2.4.7 Focus Visible',
      wcagLevel: 'AA',
      selector,
      tagName: el.tagName.toLowerCase(),
      impactSummary:
        'Sighted keyboard users lose track of where focus is positioned when tabbing through this element.',
      aiExplanation:
        'Removing outline: none without providing a high-contrast :focus-visible ring causes "lost focus" states. Restore a 2px solid focus-visible ring with 2px offset.',
      beforeHtml,
      afterHtml,
      afterJsx: htmlToJsx(afterHtml),
      remediation: {
        type: 'remove-attribute',
        attribute: 'data-no-focus-ring',
      },
      rect: getElementRect(el, win),
      isPatched: el.getAttribute('data-av-patched') === 'true',
    });
  });

  // 6. Modal Focus Trap & Dialog Semantics Bug
  doc.body.querySelectorAll('[data-modal-trap-bug="true"]').forEach((el) => {
    if (!isElementVisible(el, win)) return;
    const selector = getAvSelector(el);
    const beforeHtml = serializeElementShallow(el);
    const clone = el.cloneNode(true) as Element;
    clone.setAttribute('role', 'dialog');
    clone.setAttribute('aria-modal', 'true');
    clone.setAttribute('aria-label', 'Security Verification Modal');
    clone.removeAttribute('data-modal-trap-bug');
    const afterHtml = serializeElementShallow(clone);

    issues.push({
      id: `issue-modal-trap-${issueIdx++}`,
      ruleId: 'dialog-focus-trap',
      title: `Dialog overlay missing role="dialog", aria-modal="true", & Escape handler`,
      severity: 'critical',
      category: 'focus-keyboard',
      wcagCriteria: 'WCAG 2.1.2 No Keyboard Trap & 4.1.2',
      wcagLevel: 'A',
      selector,
      tagName: el.tagName.toLowerCase(),
      impactSummary:
        'Keyboard focus leaks behind the modal backdrop or traps users without an accessible Escape boundary.',
      aiExplanation:
        'Add role="dialog", aria-modal="true", and an accessible label so assistive technologies constrain virtual buffer navigation strictly inside the active modal container.',
      beforeHtml,
      afterHtml,
      afterJsx: htmlToJsx(afterHtml),
      remediation: {
        type: 'fix-modal-trap',
        attribute: 'role',
        value: 'dialog',
        secondaryAttribute: 'aria-modal',
        secondaryValue: 'true',
      },
      rect: getElementRect(el, win),
      isPatched: el.getAttribute('data-av-patched') === 'true',
    });
  });

  // 7. Missing Image alt Attributes
  doc.body.querySelectorAll('img:not([alt])').forEach((el) => {
    if (!isElementVisible(el, win)) return;
    const selector = getAvSelector(el);
    const suggestedAlt =
      el.getAttribute('data-suggested-alt') || 'Product preview illustration';
    const beforeHtml = serializeElementShallow(el);
    const clone = el.cloneNode(true) as Element;
    clone.setAttribute('alt', suggestedAlt);
    const afterHtml = serializeElementShallow(clone);

    issues.push({
      id: `issue-img-alt-${issueIdx++}`,
      ruleId: 'image-alt',
      title: `Image ${formatFriendlyTag(el)} missing alt attribute`,
      severity: 'critical',
      category: 'screen-reader',
      wcagCriteria: 'WCAG 1.1.1 Non-text Content',
      wcagLevel: 'A',
      selector,
      tagName: 'img',
      impactSummary:
        'Screen readers read out the raw image file URL or hash instead of meaningful description.',
      aiExplanation: `Provide descriptive alt="${suggestedAlt}" (or alt="" if purely decorative) so non-sighted users receive equivalent visual context.`,
      beforeHtml,
      afterHtml,
      afterJsx: htmlToJsx(afterHtml),
      remediation: {
        type: 'set-attribute',
        attribute: 'alt',
        value: suggestedAlt,
      },
      rect: getElementRect(el, win),
      isPatched: el.getAttribute('data-av-patched') === 'true',
    });
  });

  // 8. Dynamic Live Region / Toast Missing aria-live
  doc.body.querySelectorAll('[data-missing-live="true"]').forEach((el) => {
    if (!isElementVisible(el, win)) return;
    const selector = getAvSelector(el);
    const beforeHtml = serializeElementShallow(el);
    const clone = el.cloneNode(true) as Element;
    clone.setAttribute('role', 'status');
    clone.setAttribute('aria-live', 'polite');
    clone.removeAttribute('data-missing-live');
    const afterHtml = serializeElementShallow(clone);

    issues.push({
      id: `issue-aria-live-${issueIdx++}`,
      ruleId: 'status-messages-live',
      title: `Dynamic status banner missing role="status" and aria-live="polite"`,
      severity: 'moderate',
      category: 'screen-reader',
      wcagCriteria: 'WCAG 4.1.3 Status Messages',
      wcagLevel: 'AA',
      selector,
      tagName: el.tagName.toLowerCase(),
      impactSummary:
        'Asynchronous alerts, cart updates, or validation toasts appear visually but are never announced by screen readers.',
      aiExplanation:
        'Adding role="status" and aria-live="polite" registers this container in the browser accessibility tree live buffer so dynamic mutations are spoken automatically without stealing focus.',
      beforeHtml,
      afterHtml,
      afterJsx: htmlToJsx(afterHtml),
      remediation: {
        type: 'set-attribute',
        attribute: 'aria-live',
        value: 'polite',
        secondaryAttribute: 'role',
        secondaryValue: 'status',
      },
      rect: getElementRect(el, win),
      isPatched: el.getAttribute('data-av-patched') === 'true',
    });
  });

  // 9. Contrast & Dynamic Gradient Failures (WCAG 2.1 AA + WCAG 3.0 APCA)
  contrastReports
    .filter((c) => !c.passesAA || !c.passesApca)
    .forEach((c) => {
      const el = doc.body.querySelector(c.selector);
      if (!el) return;
      const beforeHtml = serializeElementShallow(el);
      const clone = el.cloneNode(true) as HTMLElement;
      clone.style.color = c.suggestedFgHex;
      if (c.isDynamicGradientOrImage) {
        clone.style.backgroundColor = c.suggestedBgHex;
      }
      const afterHtml = serializeElementShallow(clone);

      const effectiveRatio = c.worstGradientRatio ?? c.wcag21Ratio;

      issues.push({
        id: `issue-contrast-${issueIdx++}`,
        ruleId: c.isDynamicGradientOrImage ? 'gradient-contrast-apca' : 'color-contrast-aa',
        title: c.isDynamicGradientOrImage
          ? `Dynamic gradient contrast failure (${effectiveRatio}:1 / APCA Lc ${c.apcaLc})`
          : `Low text contrast ${effectiveRatio}:1 (APCA Lc ${c.apcaLc}) on "${c.textPreview.slice(0, 26)}"`,
        severity: effectiveRatio < 3.0 ? 'critical' : 'serious',
        category: 'contrast-apca',
        wcagCriteria: c.isDynamicGradientOrImage
          ? 'WCAG 1.4.3 & WCAG 3.0 APCA Gradient'
          : 'WCAG 1.4.3 Contrast (Minimum)',
        wcagLevel: 'AA',
        selector: c.selector,
        tagName: c.tagName,
        impactSummary: c.isDynamicGradientOrImage
          ? `Text (${c.fgHex}) over multi-stop CSS gradient drops to ${effectiveRatio}:1 against stop ${c.worstGradientBgHex} (requires 4.5:1 / |Lc| ≥ 60).`
          : `Foreground ${c.fgHex} on ${c.bgHex} achieves only ${effectiveRatio}:1 and APCA Lc ${c.apcaLc}, making text unreadable in bright environments or for low-vision users.`,
        aiExplanation: `Adjust foreground token to ${c.suggestedFgHex}${
          c.isDynamicGradientOrImage
            ? ` and apply a solid/scrim backing (${c.suggestedBgHex})`
            : ''
        } to satisfy both WCAG 2.1 AA (≥ 4.5:1) and WCAG 3.0 perceptual APCA contrast.`,
        beforeHtml,
        afterHtml,
        afterJsx: htmlToJsx(afterHtml),
        remediation: {
          type: 'fix-contrast',
          fgColor: c.suggestedFgHex,
          bgColor: c.isDynamicGradientOrImage ? c.suggestedBgHex : undefined,
        },
        rect: c.rect,
        isPatched: el.getAttribute('data-av-patched') === 'true',
      });
    });

  // Compute Weighted Health Score (0 - 100)
  const penalty = issues.reduce((acc, iss) => {
    if (iss.severity === 'critical') return acc + 11;
    if (iss.severity === 'serious') return acc + 6;
    if (iss.severity === 'moderate') return acc + 3;
    return acc + 1;
  }, 0);

  const score = Math.max(12, Math.min(100, 100 - penalty));

  return {
    issues,
    focusStops,
    contrastReports,
    a11yTree,
    score,
  };
}

/**
 * Applies an AI remediation directly to the live iframe DOM element and returns snapshot data for undo/diff
 */
export function applyRemediationToDom(
  doc: Document,
  issue: A11yIssue
): {
  success: boolean;
  snapshotAttributes: Record<string, string | null>;
  snapshotInlineStyle: string;
  afterHtmlLive: string;
} | null {
  const el = doc.body.querySelector(issue.selector) as HTMLElement | null;
  if (!el) return null;

  const snapshotAttributes: Record<string, string | null> = {};
  const snapshotInlineStyle = el.getAttribute('style') || '';

  const rem = issue.remediation;

  if (rem.attribute) {
    snapshotAttributes[rem.attribute] = el.getAttribute(rem.attribute);
  }
  if (rem.secondaryAttribute) {
    snapshotAttributes[rem.secondaryAttribute] = el.getAttribute(rem.secondaryAttribute);
  }
  snapshotAttributes['data-fake-button'] = el.getAttribute('data-fake-button');
  snapshotAttributes['data-no-focus-ring'] = el.getAttribute('data-no-focus-ring');
  snapshotAttributes['data-modal-trap-bug'] = el.getAttribute('data-modal-trap-bug');
  snapshotAttributes['data-missing-live'] = el.getAttribute('data-missing-live');

  switch (rem.type) {
    case 'set-attribute':
      if (rem.attribute && rem.value !== undefined) {
        el.setAttribute(rem.attribute, rem.value);
      }
      if (rem.secondaryAttribute && rem.secondaryValue !== undefined) {
        el.setAttribute(rem.secondaryAttribute, rem.secondaryValue);
      }
      el.removeAttribute('data-fake-button');
      el.removeAttribute('data-missing-live');
      break;

    case 'remove-attribute':
      if (rem.attribute) {
        el.removeAttribute(rem.attribute);
      }
      el.style.outline = '2px solid #4F46E5';
      el.style.outlineOffset = '2px';
      break;

    case 'fix-modal-trap':
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-modal', 'true');
      if (!el.getAttribute('aria-label')) {
        el.setAttribute('aria-label', 'Interactive Modal Dialog');
      }
      el.removeAttribute('data-modal-trap-bug');
      break;

    case 'fix-contrast':
      if (rem.fgColor) {
        const fg = rem.fgColor;
        el.style.setProperty('color', fg, 'important');
        el.querySelectorAll('span, p, strong, em, b, i, a, button').forEach((child) => {
          (child as HTMLElement).style.setProperty('color', fg, 'important');
        });
      }
      if (rem.bgColor) {
        const bg = rem.bgColor;
        el.style.setProperty('background-image', 'none', 'important');
        el.style.setProperty('background-color', bg, 'important');
        const parentBtn = el.closest('button, a, [role="button"], [class*="btn"], [class*="button"]') as HTMLElement | null;
        if (parentBtn && parentBtn !== el) {
          parentBtn.style.setProperty('background-image', 'none', 'important');
          parentBtn.style.setProperty('background-color', bg, 'important');
        }
      }
      break;
  }

  el.setAttribute('data-av-patched', 'true');

  return {
    success: true,
    snapshotAttributes,
    snapshotInlineStyle,
    afterHtmlLive: serializeElementShallow(el),
  };
}

/**
 * Reverts a previously applied live DOM patch
 */
export function revertRemediationInDom(
  doc: Document,
  selector: string,
  snapshotAttributes: Record<string, string | null>,
  snapshotInlineStyle: string
): boolean {
  const el = doc.body.querySelector(selector) as HTMLElement | null;
  if (!el) return false;

  Object.entries(snapshotAttributes).forEach(([attr, val]) => {
    if (val === null) {
      el.removeAttribute(attr);
    } else {
      el.setAttribute(attr, val);
    }
  });

  if (snapshotInlineStyle) {
    el.setAttribute('style', snapshotInlineStyle);
  } else {
    el.removeAttribute('style');
  }

  el.removeAttribute('data-av-patched');
  return true;
}
