import { create } from 'zustand';
import {
  A11yIssue,
  A11yTreeNode,
  ContrastNodeReport,
  DomPatchRecord,
  FocusStop,
  IssueCategory,
  ScreenReaderAnnouncement,
  StudioInspectorTab,
  VisionSimulationMode,
} from '../types/a11y';
import { SANDBOX_PRESETS } from '../data/sandboxPresets';

/**
 * Cleans fetched or pasted HTML so:
 * 1) <script> tags don't reboot React/MFE inside about:srcdoc and wipe the DOM to white
 * 2) Root-relative /assets/... and self-signed localhost CSS/images route through /api/proxy
 */
function sanitizeAndRewriteHtmlForSandbox(
  rawHtml: string,
  targetUrlStr?: string
): { cleanedHtml: string; isEmptySpaShell: boolean } {
  let html = rawHtml;

  // Check if headless Chrome flagged this page as stuck on an auth loader
  const hasAuthRequiredMeta = /<meta[^>]*name=["']av-auth-required["'][^>]*>/i.test(
    html
  );

  // Extract <base href="..."> if present inside pasted snapshot
  const existingBaseMatch = html.match(/<base[^>]*href=["']([^"']+)["'][^>]*>/i);
  const effectiveUrl = existingBaseMatch?.[1] || targetUrlStr || '';

  let origin = '';
  try {
    if (effectiveUrl && effectiveUrl.startsWith('http')) {
      origin = new URL(effectiveUrl).origin;
    }
  } catch {
    origin = '';
  }

  // 1. Strip <script> tags and ReactQueryDevtools so client-side routers don't wipe the DOM
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // 2. Strip CSP meta tags
  html = html.replace(
    /<meta[^>]*http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi,
    ''
  );

  // 3. Rewrite root-relative href="/..." and src="/..." (excluding /api/proxy)
  if (origin) {
    html = html.replace(
      /\b(href|src)=["']\/(?!\/|api\/proxy)([^"']*)["']/gi,
      (_match, attr, path) => {
        const fullUrl = `${origin}/${path}`;
        return `${attr}="/api/proxy?asset=1&url=${encodeURIComponent(fullUrl)}"`;
      }
    );
  }

  // 4. Rewrite full https://localhost:... or http://localhost:... asset links so self-signed certs don't block CSS
  html = html.replace(
    /\b(href|src)=["'](https?:\/\/localhost:(?!5173\b)[0-9]+\/[^"']*)["']/gi,
    (_match, attr, fullUrl) => {
      return `${attr}="/api/proxy?asset=1&url=${encodeURIComponent(fullUrl)}"`;
    }
  );

  // 5. Inject subtle styling for images that fail to load & color-scheme text adaptivity
  const helperStyles = `
<style data-av-sandbox-fixes="true">
  img { max-width: 100%; }
  :root { color-scheme: light dark; }
  body { color: CanvasText; }
</style>
`;
  html = html.replace(/<\/head>/i, `${helperStyles}</head>`);

  // Detect if the HTML is just an empty unauthenticated SPA shell or auth loader
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyInner = bodyMatch ? bodyMatch[1] : html;
  const textOnly = bodyInner
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();

  const isStuckOnLoader =
    hasAuthRequiredMeta ||
    (bodyInner.includes('LoadingBlock') && textOnly.length < 30) ||
    textOnly.length < 10;

  return { cleanedHtml: html, isEmptySpaShell: isStuckOnLoader };
}

interface StudioState {
  // Target Source State
  activePresetId: string;
  targetMode: 'preset' | 'url' | 'html';
  liveUrlInput: string;
  customHtmlInput: string;
  currentHtmlDocString: string;
  isLoadingExternalUrl: boolean;
  urlError: string | null;
  isEmptySpaShell: boolean;

  // Studio UI Navigation & Overlays
  activeTab: StudioInspectorTab;
  categoryFilter: IssueCategory | 'all';
  showFocusMapOverlay: boolean;
  showIssueBoundingBoxes: boolean;
  showContrastOverlay: boolean;
  visionMode: VisionSimulationMode;
  splitVisionCurtain: boolean;
  glaucomaCursor: { x: number; y: number };

  // Diagnostic Audit Results
  issues: A11yIssue[];
  focusStops: FocusStop[];
  contrastReports: ContrastNodeReport[];
  a11yTree: A11yTreeNode[];
  score: number;
  initialScore: number | null;

  // Interactive Selection & Stepper
  selectedIssueId: string | null;
  selectedSelector: string | null;
  hoveredSelector: string | null;
  activeFocusStepIndex: number | null;

  // Screen Reader Simulator State
  announcements: ScreenReaderAnnouncement[];
  voiceSynthEnabled: boolean;

  // Live DOM Hot-Patch History
  appliedPatches: DomPatchRecord[];

  // Actions
  setPreset: (presetId: string) => void;
  setCustomHtml: (html: string) => void;
  loadExternalUrl: (url: string) => Promise<void>;
  setActiveTab: (tab: StudioInspectorTab) => void;
  setCategoryFilter: (cat: IssueCategory | 'all') => void;
  setShowFocusMapOverlay: (show: boolean) => void;
  setShowIssueBoundingBoxes: (show: boolean) => void;
  setShowContrastOverlay: (show: boolean) => void;
  setVisionMode: (mode: VisionSimulationMode) => void;
  setSplitVisionCurtain: (split: boolean) => void;
  setGlaucomaCursor: (pos: { x: number; y: number }) => void;
  setAuditResults: (results: {
    issues: A11yIssue[];
    focusStops: FocusStop[];
    contrastReports: ContrastNodeReport[];
    a11yTree: A11yTreeNode[];
    score: number;
    resetInitialScore?: boolean;
  }) => void;
  selectIssue: (issueId: string | null, selector?: string | null) => void;
  setHoveredSelector: (selector: string | null) => void;
  setActiveFocusStepIndex: (index: number | null) => void;
  pushAnnouncement: (ann: ScreenReaderAnnouncement) => void;
  clearAnnouncements: () => void;
  setVoiceSynthEnabled: (enabled: boolean) => void;
  recordPatch: (patch: DomPatchRecord) => void;
  removePatchRecord: (patchId: string) => void;
  clearPatches: () => void;
}

const defaultPreset = SANDBOX_PRESETS[0];

export const useStudioStore = create<StudioState>((set, get) => ({
  activePresetId: defaultPreset.id,
  targetMode: 'preset',
  liveUrlInput: 'https://localhost:8030/manage/sites',
  customHtmlInput: defaultPreset.htmlContent,
  currentHtmlDocString: defaultPreset.htmlContent,
  isLoadingExternalUrl: false,
  urlError: null,
  isEmptySpaShell: false,

  activeTab: 'issues',
  categoryFilter: 'all',
  showFocusMapOverlay: false,
  showIssueBoundingBoxes: false,
  showContrastOverlay: false,
  visionMode: 'normal',
  splitVisionCurtain: false,
  glaucomaCursor: { x: 420, y: 260 },

  issues: [],
  focusStops: [],
  contrastReports: [],
  a11yTree: [],
  score: 100,
  initialScore: null,

  selectedIssueId: null,
  selectedSelector: null,
  hoveredSelector: null,
  activeFocusStepIndex: null,

  announcements: [],
  voiceSynthEnabled: false,

  appliedPatches: [],

  setPreset: (presetId) => {
    const found = SANDBOX_PRESETS.find((p) => p.id === presetId) || SANDBOX_PRESETS[0];
    set({
      activePresetId: found.id,
      targetMode: 'preset',
      currentHtmlDocString: found.htmlContent,
      urlError: null,
      isEmptySpaShell: false,
      selectedIssueId: null,
      selectedSelector: null,
      activeFocusStepIndex: null,
      appliedPatches: [],
      initialScore: null,
    });
  },

  setCustomHtml: (html) => {
    const currentUrl = get().liveUrlInput;
    const { cleanedHtml, isEmptySpaShell } = sanitizeAndRewriteHtmlForSandbox(
      html,
      currentUrl
    );
    set({
      targetMode: 'html',
      customHtmlInput: cleanedHtml,
      currentHtmlDocString: cleanedHtml,
      urlError: null,
      isEmptySpaShell,
      selectedIssueId: null,
      selectedSelector: null,
      activeFocusStepIndex: null,
      appliedPatches: [],
      initialScore: null,
    });
  },

  loadExternalUrl: async (url) => {
    let normalized = url.trim();
    if (!/^https?:\/\//i.test(normalized)) {
      const isLocal = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?/i.test(normalized);
      normalized = `${isLocal ? 'http' : 'https'}://${normalized}`;
    }
    set({
      isLoadingExternalUrl: true,
      urlError: null,
      isEmptySpaShell: false,
      liveUrlInput: normalized,
      targetMode: 'url',
    });

    try {
      const res = await fetch(`/api/proxy?url=${encodeURIComponent(normalized)}`);
      if (!res.ok) {
        let serverErr = `Proxy returned HTTP ${res.status}`;
        try {
          const errJson = await res.json();
          if (errJson && errJson.error) {
            serverErr = errJson.error;
          }
        } catch {
          // ignore JSON parse error
        }

        const isLocalTarget = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)/i.test(
          normalized
        );
        if (!isLocalTarget) {
          const fallbackRes = await fetch(
            `https://api.allorigins.win/raw?url=${encodeURIComponent(normalized)}`
          );
          if (fallbackRes.ok) {
            const rawHtml = await fallbackRes.text();
            const { cleanedHtml, isEmptySpaShell } = sanitizeAndRewriteHtmlForSandbox(
              rawHtml,
              normalized
            );
            set({
              currentHtmlDocString: cleanedHtml,
              isLoadingExternalUrl: false,
              urlError: null,
              isEmptySpaShell,
              selectedIssueId: null,
              selectedSelector: null,
              activeFocusStepIndex: null,
              appliedPatches: [],
              initialScore: null,
            });
            return;
          }
        }

        throw new Error(serverErr);
      }

      const rawHtml = await res.text();
      const { cleanedHtml, isEmptySpaShell } = sanitizeAndRewriteHtmlForSandbox(
        rawHtml,
        normalized
      );

      set({
        currentHtmlDocString: cleanedHtml,
        isLoadingExternalUrl: false,
        urlError: null,
        isEmptySpaShell,
        selectedIssueId: null,
        selectedSelector: null,
        activeFocusStepIndex: null,
        appliedPatches: [],
        initialScore: null,
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Unable to fetch remote URL via local proxy.';
      set({
        isLoadingExternalUrl: false,
        urlError: msg,
      });
    }
  },

  setActiveTab: (tab) => {
    const updates: Partial<StudioState> = {
      activeTab: tab,
      showFocusMapOverlay: tab === 'focus-map',
      showContrastOverlay: false,
    };
    set(updates);
  },

  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
  setShowFocusMapOverlay: (showFocusMapOverlay) => set({ showFocusMapOverlay }),
  setShowIssueBoundingBoxes: (showIssueBoundingBoxes) => set({ showIssueBoundingBoxes }),
  setShowContrastOverlay: (showContrastOverlay) => set({ showContrastOverlay }),
  setVisionMode: (visionMode) => set({ visionMode }),
  setSplitVisionCurtain: (splitVisionCurtain) => set({ splitVisionCurtain }),
  setGlaucomaCursor: (glaucomaCursor) => set({ glaucomaCursor }),

  setAuditResults: ({
    issues,
    focusStops,
    contrastReports,
    a11yTree,
    score,
    resetInitialScore,
  }) => {
    const currentInitial = get().initialScore;
    set({
      issues,
      focusStops,
      contrastReports,
      a11yTree,
      score,
      initialScore:
        resetInitialScore || currentInitial === null ? score : currentInitial,
    });
  },

  selectIssue: (selectedIssueId, selector) =>
    set({
      selectedIssueId,
      selectedSelector: selector !== undefined ? selector : get().selectedSelector,
    }),

  setHoveredSelector: (hoveredSelector) => set({ hoveredSelector }),

  setActiveFocusStepIndex: (activeFocusStepIndex) => set({ activeFocusStepIndex }),

  pushAnnouncement: (ann) => {
    const { voiceSynthEnabled, announcements } = get();
    if (voiceSynthEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(ann.voiceOverOutput);
        utter.rate = 1.08;
        window.speechSynthesis.speak(utter);
      } catch {
        // Ignore speech synthesis errors on restricted browsers
      }
    }
    set({
      announcements: [ann, ...announcements].slice(0, 35),
    });
  },

  clearAnnouncements: () => set({ announcements: [] }),

  setVoiceSynthEnabled: (voiceSynthEnabled) => set({ voiceSynthEnabled }),

  recordPatch: (patch) =>
    set((state) => ({
      appliedPatches: [patch, ...state.appliedPatches],
    })),

  removePatchRecord: (patchId: string) =>
    set((state) => ({
      appliedPatches: state.appliedPatches.filter((p) => p.id !== patchId),
    })),

  clearPatches: () => set({ appliedPatches: [] }),
}));
