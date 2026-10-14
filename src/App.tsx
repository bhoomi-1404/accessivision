import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SvgVisionFilters } from './components/SvgVisionFilters';
import { TopStudioBar } from './components/TopStudioBar';
import { InteractiveViewport } from './components/InteractiveViewport';
import { InspectorPanel } from './components/InspectorPanel';
import { LandingPage } from './components/LandingPage';
import { useStudioStore } from './store/useStudioStore';
import {
  applyRemediationToDom,
  auditLiveDocument,
  createScreenReaderAnnouncement,
  revertRemediationInDom,
} from './engine/domAuditor';
import { A11yIssue } from './types/a11y';

export const App: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // View state: 'landing' page or live 'studio' sandbox
  const [currentView, setCurrentView] = useState<'landing' | 'studio'>(() => {
    return window.location.hash.toLowerCase().includes('studio') ? 'studio' : 'landing';
  });

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash.toLowerCase().includes('studio')) {
        setCurrentView('studio');
      } else {
        setCurrentView('landing');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleLaunchStudio = (presetOrCustom?: string) => {
    setCurrentView('studio');
    window.location.hash = '#studio';
  };

  const handleNavigateHome = () => {
    setCurrentView('landing');
    window.location.hash = '#';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Resizable Right Inspector Panel Width
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('accessivision_sidebar_width');
      return saved ? Math.max(320, Math.min(780, parseInt(saved, 10))) : 460;
    } catch {
      return 460;
    }
  });
  const [isDraggingSidebar, setIsDraggingSidebar] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem('accessivision_sidebar_width', sidebarWidth.toString());
    } catch {}
  }, [sidebarWidth]);

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingSidebar(true);
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = startX - moveEvent.clientX;
      const minW = 320;
      const maxW = Math.max(minW, Math.min(820, window.innerWidth - 380));
      const nextWidth = Math.max(minW, Math.min(maxW, startWidth + delta));
      setSidebarWidth(nextWidth);
    };

    const handleMouseUp = () => {
      setIsDraggingSidebar(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      // Re-trigger live audit so overlays adapt to new container width
      setTimeout(() => {
        runAuditOnLiveIframe(false);
      }, 60);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const {
    issues,
    focusStops,
    appliedPatches,
    activePresetId,
    setPreset,
    setAuditResults,
    setActiveFocusStepIndex,
    selectIssue,
    pushAnnouncement,
    recordPatch,
    removePatchRecord,
    clearPatches,
  } = useStudioStore();

  const runAuditOnLiveIframe = useCallback(
    (resetInitialScore = false) => {
      const doc = iframeRef.current?.contentDocument;
      if (!doc || !doc.body) return;
      const results = auditLiveDocument(doc);
      setAuditResults({
        ...results,
        resetInitialScore,
      });
    },
    [setAuditResults]
  );

  // Flash a temporary visual ring inside the iframe when an element is selected or healed
  const flashElementInIframe = (selector: string, color = '#10B981') => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    const el = doc.body.querySelector(selector) as HTMLElement | null;
    if (!el) return;

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const prevTransition = el.style.transition;
    const prevBoxShadow = el.style.boxShadow;
    el.style.transition = 'box-shadow 0.25s ease';
    el.style.boxShadow = `0 0 0 4px ${color}`;
    setTimeout(() => {
      el.style.boxShadow = prevBoxShadow;
      el.style.transition = prevTransition;
    }, 900);
  };

  // Apply a single AI remediation directly to the live iframe DOM
  const handleApplySingleFix = (issue: A11yIssue) => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;

    const patchResult = applyRemediationToDom(doc, issue);
    if (!patchResult) return;

    recordPatch({
      id: `patch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      issueId: issue.id,
      ruleId: issue.ruleId,
      selector: issue.selector,
      timestamp: new Date().toLocaleTimeString(),
      summary: issue.title,
      beforeHtml: issue.beforeHtml,
      afterHtml: issue.afterHtml,
      afterJsx: issue.afterJsx,
      snapshotAttributes: patchResult.snapshotAttributes,
      snapshotInlineStyle: patchResult.snapshotInlineStyle,
    });

    flashElementInIframe(issue.selector, '#10B981');
    runAuditOnLiveIframe(false);
  };

  // One-click Auto-Heal All Issues in the live DOM
  const handleApplyAllFixes = () => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;

    const unpatched = issues.filter((i) => !i.isPatched);
    unpatched.forEach((issue) => {
      const patchResult = applyRemediationToDom(doc, issue);
      if (patchResult) {
        recordPatch({
          id: `patch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          issueId: issue.id,
          ruleId: issue.ruleId,
          selector: issue.selector,
          timestamp: new Date().toLocaleTimeString(),
          summary: issue.title,
          beforeHtml: issue.beforeHtml,
          afterHtml: issue.afterHtml,
          afterJsx: issue.afterJsx,
          snapshotAttributes: patchResult.snapshotAttributes,
          snapshotInlineStyle: patchResult.snapshotInlineStyle,
        });
      }
    });

    runAuditOnLiveIframe(false);
  };

  // Revert a single patch in the live DOM
  const handleRevertSingleFix = (issueId: string) => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;

    const patch = appliedPatches.find((p) => p.issueId === issueId);
    if (!patch) return;

    revertRemediationInDom(
      doc,
      patch.selector,
      patch.snapshotAttributes,
      patch.snapshotInlineStyle
    );
    removePatchRecord(patch.id);
    runAuditOnLiveIframe(false);
  };

  // Reset all live patches back to original sandbox state
  const handleResetSandbox = () => {
    clearPatches();
    setPreset(activePresetId);
    setTimeout(() => runAuditOnLiveIframe(true), 80);
  };

  // Apply custom contrast color from the Contrast Inspector tab
  const handleApplyCustomContrast = (
    selector: string,
    fgHex: string,
    bgHex?: string
  ) => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    const el = doc.body.querySelector(selector) as HTMLElement | null;
    if (!el) return;

    const beforeHtml = el.outerHTML.slice(0, 160);
    const snapshotInlineStyle = el.getAttribute('style') || '';

    // Apply high-priority styles with !important to overcome any stylesheet classes
    if (fgHex) {
      el.style.setProperty('color', fgHex, 'important');
      // If el has nested text tags (e.g. <span>Follow</span>), propagate color to them
      el.querySelectorAll('span, p, strong, em, b, i, a').forEach((child) => {
        (child as HTMLElement).style.setProperty('color', fgHex, 'important');
      });
    }

    if (bgHex) {
      el.style.setProperty('background-image', 'none', 'important');
      el.style.setProperty('background-color', bgHex, 'important');

      // If el is an inline element inside a button or anchor (e.g. <span> inside <button>),
      // ensure the parent button's background is also styled
      const parentContainer = el.closest('button, a, [role="button"], [class*="btn"], [class*="button"]') as HTMLElement | null;
      if (parentContainer && parentContainer !== el) {
        parentContainer.style.setProperty('background-image', 'none', 'important');
        parentContainer.style.setProperty('background-color', bgHex, 'important');
      }
    }
    el.setAttribute('data-av-patched', 'true');

    const afterHtml = el.outerHTML.slice(0, 160);
    recordPatch({
      id: `patch-contrast-${Date.now()}`,
      issueId: `contrast-${selector}`,
      ruleId: 'apca-contrast-tune',
      selector,
      timestamp: new Date().toLocaleTimeString(),
      summary: `Contrast tuned to ${fgHex}${bgHex ? ` on ${bgHex}` : ''}`,
      beforeHtml,
      afterHtml,
      afterJsx: afterHtml.replace(/\bclass=/g, 'className='),
      snapshotAttributes: {},
      snapshotInlineStyle,
    });

    flashElementInIframe(selector, '#10B981');
    runAuditOnLiveIframe(false);
  };

  // Focus a specific sequential keyboard stop inside the live iframe & announce via Screen Reader
  const handleFocusStopSelect = useCallback(
    (stopIndex: number) => {
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return;

      const currentStops = useStudioStore.getState().focusStops;
      const stop = currentStops.find((s) => s.index === stopIndex);
      if (!stop) return;

      setActiveFocusStepIndex(stopIndex);
      selectIssue(null, stop.selector);

      const el = doc.body.querySelector(stop.selector) as HTMLElement | null;
      if (el) {
        el.focus({ preventScroll: false });
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const ann = createScreenReaderAnnouncement(el, doc, 'focus');
        pushAnnouncement(ann);
      }
    },
    [pushAnnouncement, selectIssue, setActiveFocusStepIndex]
  );

  // Highlight and scroll to any DOM element selected from the Inspector
  const handleSelectDomElement = (selector: string) => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    const el = doc.body.querySelector(selector) as HTMLElement | null;
    if (el) {
      flashElementInIframe(selector, '#0D9488');
      const ann = createScreenReaderAnnouncement(el, doc, 'focus');
      pushAnnouncement(ann);
    }
  };

  if (currentView === 'landing') {
    return (
      <div className="w-full min-h-screen bg-[#080C12] text-slate-100">
        <SvgVisionFilters />
        <LandingPage onLaunchStudio={handleLaunchStudio} />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#080C12] text-slate-100 overflow-hidden">
      <SvgVisionFilters />

      <TopStudioBar
        onApplyAllFixes={handleApplyAllFixes}
        onResetSandbox={handleResetSandbox}
        onNavigateHome={handleNavigateHome}
      />

      <main className="flex-1 flex overflow-hidden relative">
        <InteractiveViewport
          iframeRef={iframeRef}
          onRunAudit={runAuditOnLiveIframe}
          onFocusStopSelect={handleFocusStopSelect}
          isDragging={isDraggingSidebar}
        />

        {/* Draggable Divider Handle */}
        <div
          onMouseDown={handleMouseDownResize}
          title="Drag left or right to resize Inspector Panel and Viewport"
          className={`w-2 hover:w-2.5 bg-[#0A0E17] hover:bg-teal-500 cursor-col-resize transition-colors relative z-30 group shrink-0 select-none flex items-center justify-center border-l border-r border-slate-800 hover:border-teal-400 ${
            isDraggingSidebar ? 'bg-teal-500 border-teal-400' : ''
          }`}
        >
          <div
            className={`w-0.5 h-8 rounded-full transition-colors ${
              isDraggingSidebar
                ? 'bg-white'
                : 'bg-slate-600 group-hover:bg-white'
            }`}
          />
        </div>

        <InspectorPanel
          width={sidebarWidth}
          onApplySingleFix={handleApplySingleFix}
          onRevertSingleFix={handleRevertSingleFix}
          onApplyCustomContrast={handleApplyCustomContrast}
          onFocusStopSelect={handleFocusStopSelect}
          onSelectDomElement={handleSelectDomElement}
        />
      </main>
    </div>
  );
};

export default App;
