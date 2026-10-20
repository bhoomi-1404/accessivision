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

  // 3. Resolve root-relative href="/..." and src="/..." directly to full origin URLs
  if (origin) {
    html = html.replace(
      /\b(href|src)=["']\/(?!\/)([^"']*)["']/gi,
      (_match, attr, path) => {
        return `${attr}="${origin}/${path}"`;
      }
    );
  }

  // 4. Decode any /api/proxy?asset=1 wrapper back to direct URL
  html = html.replace(
    /\b(href|src)=["']\/api\/proxy\?asset=1&url=([^"']+)["']/gi,
    (_match, attr, encodedUrl) => {
      try {
        return `${attr}="${decodeURIComponent(encodedUrl)}"`;
      } catch {
        return `${attr}="${encodedUrl}"`;
      }
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
  sourceModalOpen: boolean;
  sourceModalTab: 'url' | 'html';

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
  openSourceModal: (tab?: 'url' | 'html') => void;
  closeSourceModal: () => void;
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
  sourceModalOpen: false,
  sourceModalTab: 'url',

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

  openSourceModal: (tab = 'url') => set({ sourceModalOpen: true, sourceModalTab: tab }),
  closeSourceModal: () => set({ sourceModalOpen: false }),

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
      let rawHtml: string | null = null;

      // 1. Try local Vite dev proxy first (available when running npm run dev)
      try {
        const res = await fetch(`/api/proxy?url=${encodeURIComponent(normalized)}`);
        if (res.ok) {
          rawHtml = await res.text();
        }
      } catch {
        // Not running local proxy (e.g. static GitHub Pages)
      }

      // 2. If not running local proxy and target is a public website, attempt CORS proxy fallback chain
      const isLocalTarget = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)/i.test(normalized);

      if (!rawHtml && !isLocalTarget) {
        // Fallback A: corsproxy.io
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 6000);
          const proxyA = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(normalized)}`, {
            signal: controller.signal,
          });
          clearTimeout(timer);
          if (proxyA.ok) {
            const text = await proxyA.text();
            if (text && text.length > 60) rawHtml = text;
          }
        } catch {}
      }

      if (!rawHtml && !isLocalTarget) {
        // Fallback B: allorigins.win (JSON contents)
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 6000);
          const proxyB = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(normalized)}`, {
            signal: controller.signal,
          });
          clearTimeout(timer);
          if (proxyB.ok) {
            const data = await proxyB.json();
            if (data && data.contents && data.contents.length > 60) {
              rawHtml = data.contents;
            }
          }
        } catch {}
      }

      if (!rawHtml && !isLocalTarget) {
        // Fallback C: codetabs proxy
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 6000);
          const proxyC = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(normalized)}`, {
            signal: controller.signal,
          });
          clearTimeout(timer);
          if (proxyC.ok) {
            const text = await proxyC.text();
            if (text && text.length > 60) rawHtml = text;
          }
        } catch {}
      }

      if (!rawHtml) {
        if (isLocalTarget) {
          throw new Error(
            `Cannot connect to local server (${normalized}) from static GitHub Pages. To audit your local project, please use the "Paste HTML / React DOM" option or run AccessiVision locally via "npm run dev".`
          );
        }
        throw new Error(
          `This website blocks automated cross-origin requests (CORS). On static GitHub Pages, click "Paste HTML Code Instead" below to paste and audit this page directly.`
        );
      }

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
          : 'Unable to load remote URL.';
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
