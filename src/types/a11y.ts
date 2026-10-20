export type IssueSeverity = 'critical' | 'serious' | 'moderate' | 'minor';

export type IssueCategory =
  | 'focus-keyboard'
  | 'contrast-apca'
  | 'semantics-aria'
  | 'screen-reader';

export interface BoundingBox {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface RemediationInstruction {
  type:
    | 'set-attribute'
    | 'remove-attribute'
    | 'replace-tag-role'
    | 'fix-contrast'
    | 'link-label'
    | 'fix-modal-trap'
    | 'fix-heading';
  attribute?: string;
  value?: string;
  secondaryAttribute?: string;
  secondaryValue?: string;
  fgColor?: string;
  bgColor?: string;
  labelText?: string;
}

export interface A11yIssue {
  id: string;
  ruleId: string;
  title: string;
  severity: IssueSeverity;
  category: IssueCategory;
  wcagCriteria: string;
  wcagLevel: 'A' | 'AA' | 'AAA' | 'WCAG 3.0 APCA';
  selector: string;
  tagName: string;
  impactSummary: string;
  aiExplanation: string;
  beforeHtml: string;
  afterHtml: string;
  afterJsx: string;
  remediation: RemediationInstruction;
  rect: BoundingBox;
  isPatched: boolean;
}

export interface FocusStop {
  index: number;
  selector: string;
  tagName: string;
  role: string;
  accessibleName: string;
  rawTabIndex: number | null;
  effectiveTabIndex: number;
  rect: BoundingBox;
  hasFocusRing: boolean;
  isPositiveTabIndexAnomaly: boolean;
  isVisualOrderMismatch: boolean;
  isInsideModalTrap: boolean;
  isMissingAccessibleName: boolean;
  distanceFromPrev: number;
}

export interface ContrastNodeReport {
  id: string;
  selector: string;
  tagName: string;
  textPreview: string;
  fontSizePx: number;
  fontWeight: number;
  isLargeText: boolean;
  fgHex: string;
  fgRgba: [number, number, number, number];
  bgHex: string;
  bgRgba: [number, number, number, number];
  worstGradientBgHex?: string;
  isDynamicGradientOrImage: boolean;
  rawBackgroundStyle: string;
  wcag21Ratio: number;
  worstGradientRatio?: number;
  passesAA: boolean;
  passesAAA: boolean;
  apcaLc: number;
  passesApca: boolean;
  suggestedFgHex: string;
  suggestedBgHex: string;
  rect: BoundingBox;
  isPatched: boolean;
  beforeHtml?: string;
  afterHtmlFg?: string;
  afterHtmlBg?: string;
  cssCurrent?: string;
  cssSuggestedFg?: string;
  cssSuggestedBg?: string;
  explanation?: string;
}

export interface A11yTreeNode {
  id: string;
  selector: string;
  tagName: string;
  role: string;
  accessibleName: string;
  states: string[];
  ariaLive: 'off' | 'polite' | 'assertive';
  tabIndex: number | null;
  isFocusable: boolean;
  hasMissingName: boolean;
  rect: BoundingBox;
  children: A11yTreeNode[];
}

export interface ScreenReaderAnnouncement {
  id: string;
  timestamp: string;
  politeness: 'focus' | 'polite' | 'assertive';
  selector: string;
  role: string;
  accessibleName: string;
  voiceOverOutput: string;
  nvdaOutput: string;
  warning?: string;
}

export type VisionSimulationMode =
  | 'normal'
  | 'deuteranopia'
  | 'protanopia'
  | 'tritanopia'
  | 'achromatopsia'
  | 'cataracts'
  | 'glaucoma'
  | 'low-acuity';

export interface VisionModeConfig {
  id: VisionSimulationMode;
  name: string;
  shortLabel: string;
  prevalence: string;
  category: 'Color Vision Deficiency' | 'Optical & Retinal' | 'Baseline';
  description: string;
  uxImpact: string;
  matrixValues?: string;
}

export interface DomPatchRecord {
  id: string;
  issueId: string;
  ruleId: string;
  selector: string;
  timestamp: string;
  summary: string;
  beforeHtml: string;
  afterHtml: string;
  afterJsx: string;
  snapshotAttributes: Record<string, string | null>;
  snapshotInlineStyle: string;
}

export interface SandboxPreset {
  id: string;
  name: string;
  subtitle: string;
  badge: string;
  domain: string;
  description: string;
  featuredBugs: string[];
  htmlContent: string;
}

export type StudioInspectorTab =
  | 'issues'
  | 'focus-map'
  | 'contrast'
  | 'screen-reader'
  | 'vision-lab'
  | 'git-diff';
