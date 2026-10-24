import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Code2,
  Copy,
  CornerDownLeft,
  Eye,
  Layers,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  Waypoints,
} from 'lucide-react';
import { useStudioStore } from '../store/useStudioStore';
import { createScreenReaderAnnouncement } from '../engine/domAuditor';
import { VISION_MODES } from '../engine/visionConfigs';
import { GlossaryBadge, InfoTooltip } from './InfoTooltip';
import { BoundingBox } from '../types/a11y';

interface InteractiveViewportProps {
  iframeRef: React.RefObject<HTMLIFrameElement>;
  onRunAudit: (resetInitialScore?: boolean) => void;
  onFocusStopSelect: (stopIndex: number) => void;
  isDragging?: boolean;
}

export const InteractiveViewport: React.FC<InteractiveViewportProps> = ({
  iframeRef,
  onRunAudit,
  onFocusStopSelect,
  isDragging = false,
}) => {
  const {
    currentHtmlDocString,
    liveUrlInput,
    isLoadingExternalUrl,
    urlError,
    isEmptySpaShell,
    showFocusMapOverlay,
    showIssueBoundingBoxes,
    showContrastOverlay,
    visionMode,
    splitVisionCurtain,
    glaucomaCursor,
    issues,
    focusStops,
    contrastReports,
    selectedIssueId,
    selectedSelector,
    hoveredSelector,
    activeFocusStepIndex,
    announcements,
    voiceSynthEnabled,
    setCustomHtml,
    openSourceModal,
    setShowFocusMapOverlay,
    setShowIssueBoundingBoxes,
    setVisionMode,
    setSplitVisionCurtain,
    setGlaucomaCursor,
    selectIssue,
    pushAnnouncement,
    setVoiceSynthEnabled,
  } = useStudioStore();

  const viewportWrapRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [splitPercent, setSplitPercent] = useState(50);
  const [isAutoPlayingFocus, setIsAutoPlayingFocus] = useState(false);
  const [iframeHeight, setIframeHeight] = useState(640);
  const [isFullWidth, setIsFullWidth] = useState(true);
  const [heightMode, setHeightMode] = useState<'fit-content' | 'screen'>('fit-content');
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [iframeScroll, setIframeScroll] = useState({ x: 0, y: 0 });
  const [iframeLayoutVersion, setIframeLayoutVersion] = useState(0);
  const lastPushIdRef = useRef<number>(0);

  // Real-time live bounding box lookup for pixel-perfect overlay positioning
  const getLiveRect = useCallback(
    (
      doc: Document | null | undefined,
      selector: string,
      fallbackRect: BoundingBox
    ): BoundingBox => {
      if (!doc || !doc.body) return fallbackRect;
      try {
        const el = doc.querySelector(selector) as HTMLElement | null;
        if (!el) return fallbackRect;
        const elRect = el.getBoundingClientRect();
        if (elRect.width === 0 && elRect.height === 0) return fallbackRect;

        const docEl = doc.documentElement;
        const docRect = docEl.getBoundingClientRect();

        return {
          left: Math.round(elRect.left - docRect.left),
          top: Math.round(elRect.top - docRect.top),
          width: Math.round(elRect.width),
          height: Math.round(elRect.height),
        };
      } catch {
        return fallbackRect;
      }
    },
    []
  );

  // Listen for live DOM pushes from other tabs via /api/push-dom
  useEffect(() => {
    const interval = window.setInterval(async () => {
      try {
        const res = await fetch('/api/push-dom');
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.id && data.id > lastPushIdRef.current && data.html) {
          lastPushIdRef.current = data.id;
          setCustomHtml(data.html);
        }
      } catch {
        // ignore polling errors
      }
    }, 1500);
    return () => window.clearInterval(interval);
  }, [setCustomHtml]);

  // Allow pressing Cmd+V anywhere on the Studio page to paste copied <html> from DevTools Elements tab
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      const pasted = e.clipboardData?.getData('text/plain');
      if (pasted && pasted.includes('<')) {
        e.preventDefault();
        setPasteError(null);
        setCustomHtml(pasted);
      }
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [setCustomHtml]);

  const activeVisionConfig =
    VISION_MODES.find((m) => m.id === visionMode) || VISION_MODES[0];

  const latestAnnouncement = announcements[0] || null;
  const activeBugsCount = issues.filter((i) => !i.isPatched).length;

  useEffect(() => {
    return () => {
      resizeObserverRef.current?.disconnect();
    };
  }, []);

  // When width mode or heightMode toggles, re-measure height and refresh live overlay positions
  useEffect(() => {
    const timer = setTimeout(() => {
      const doc = iframeRef.current?.contentDocument;
      if (doc && doc.body) {
        onRunAudit(false);
        setIframeLayoutVersion((v) => (v + 1) % 1000000);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [isFullWidth, heightMode, onRunAudit]);

  const handleIframeLoad = () => {
    const doc = iframeRef.current?.contentDocument;
    const win = iframeRef.current?.contentWindow;
    if (!doc || !win) return;

    // Track scroll events inside the iframe so bug boxes stay locked to content in screen mode
    const syncScroll = () => {
      if (win) {
        setIframeScroll({ x: win.scrollX, y: win.scrollY });
      }
    };
    syncScroll();
    win.addEventListener('scroll', syncScroll, { passive: true });

    const measureAndSetHeight = () => {
      if (!doc || !doc.body) return;
      const bodyScroll = doc.body.scrollHeight;
      const docScroll = doc.documentElement ? doc.documentElement.scrollHeight : 0;
      const contentHeight = Math.max(560, bodyScroll, docScroll);
      setIframeHeight((prev) => {
        if (Math.abs(prev - contentHeight) > 16) {
          return contentHeight;
        }
        return prev;
      });
      setIframeLayoutVersion((v) => (v + 1) % 1000000);
    };

    measureAndSetHeight();
    onRunAudit(true);

    // Watch for React/MFE async card rendering so height & bounding boxes adapt
    resizeObserverRef.current?.disconnect();
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => {
        measureAndSetHeight();
        setIframeLayoutVersion((v) => (v + 1) % 1000000);
      });
      if (doc.body) ro.observe(doc.body);
      if (iframeRef.current) ro.observe(iframeRef.current);
      resizeObserverRef.current = ro;
    }

    // Catch layout shifts after webfonts or CSS stylesheets settle
    if (doc.fonts && doc.fonts.ready) {
      doc.fonts.ready.then(() => {
        measureAndSetHeight();
        onRunAudit(false);
        setIframeLayoutVersion((v) => (v + 1) % 1000000);
      });
    }

    const t1 = setTimeout(() => {
      measureAndSetHeight();
      onRunAudit(false);
      setIframeLayoutVersion((v) => (v + 1) % 1000000);
    }, 180);

    const t2 = setTimeout(() => {
      measureAndSetHeight();
      onRunAudit(false);
      setIframeLayoutVersion((v) => (v + 1) % 1000000);
    }, 600);

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as Element | null;
      if (!target || target === doc.body || target === doc.documentElement) return;
      const ann = createScreenReaderAnnouncement(target, doc, 'focus');
      pushAnnouncement(ann);
    };

    doc.addEventListener('focusin', handleFocusIn);
  };

  useEffect(() => {
    if (!isAutoPlayingFocus) return;
    if (focusStops.length === 0) {
      setIsAutoPlayingFocus(false);
      return;
    }

    const timer = window.setInterval(() => {
      const current = useStudioStore.getState().activeFocusStepIndex;
      const nextIdx =
        current === null || current >= focusStops.length ? 1 : current + 1;
      onFocusStopSelect(nextIdx);
    }, 1400);

    return () => window.clearInterval(timer);
  }, [isAutoPlayingFocus, focusStops.length, onFocusStopSelect]);

  const stepKeyboardFocus = (direction: 1 | -1) => {
    if (focusStops.length === 0) return;
    const current = activeFocusStepIndex || 0;
    let next = current + direction;
    if (next > focusStops.length) next = 1;
    if (next < 1) next = focusStops.length;
    onFocusStopSelect(next);
  };

  const triggerEnterOnFocused = () => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc || !activeFocusStepIndex) return;
    const stop = focusStops.find((s) => s.index === activeFocusStepIndex);
    if (!stop) return;
    const el = doc.body.querySelector(stop.selector) as HTMLElement | null;
    if (el) {
      el.click();
      setTimeout(() => onRunAudit(false), 120);
    }
  };

  const getVisionFilterStyle = (): React.CSSProperties => {
    if (visionMode === 'normal' || visionMode === 'glaucoma') {
      return {};
    }
    return {
      filter: `url(#av-filter-${visionMode})`,
    };
  };

  return (
    <div className="flex-1 flex flex-col bg-[#090A0F] overflow-hidden relative">
      {/* Clean DevTools Canvas Toolbar */}
      <div className="h-11 bg-[#0E1017] border-b border-zinc-800 px-4 flex items-center justify-between gap-3 text-xs z-20">
        {/* Left: Visual Overlay Toggles */}
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-500 text-[11px] font-medium mr-1 hidden sm:inline">
            Overlays:
          </span>

          <InfoTooltip
            title="Keyboard Tab Order Path"
            description="Draws numbered indicators showing the exact sequential order a keyboard user traverses through the DOM when pressing the Tab key."
            extraNote="Red dashed connectors flag illogical jumps or keyboard traps."
            align="left"
          >
            <button
              onClick={() => setShowFocusMapOverlay(!showFocusMapOverlay)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 border transition-colors ${
                showFocusMapOverlay
                  ? 'bg-zinc-800 text-white border-zinc-600'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <Waypoints className="w-3.5 h-3.5 text-sky-400" />
              <span>
                Focus Order ({focusStops.length})
              </span>
            </button>
          </InfoTooltip>

          <InfoTooltip
            title="Highlight Accessibility Violations"
            description="Outlines broken elements on the page simultaneously. When toggled off, outlines appear only on hover or selection."
            align="left"
          >
            <button
              onClick={() => setShowIssueBoundingBoxes(!showIssueBoundingBoxes)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 border transition-colors ${
                showIssueBoundingBoxes
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-rose-400" />
              <span>
                Violations ({activeBugsCount})
              </span>
            </button>
          </InfoTooltip>

          <div className="h-4 w-px bg-zinc-800 mx-1 hidden sm:block" />

          {/* Canvas Modes */}
          <button
            onClick={() => setIsFullWidth(!isFullWidth)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 border transition-colors ${
              isFullWidth
                ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
            }`}
            title="Toggle between 100% full-width canvas and centered 960px device frame"
          >
            {isFullWidth ? (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-zinc-400" />
                <span>100% Width</span>
              </>
            ) : (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-zinc-400" />
                <span>Frame (960px)</span>
              </>
            )}
          </button>

          <button
            onClick={() =>
              setHeightMode(
                heightMode === 'fit-content' ? 'screen' : 'fit-content'
              )
            }
            className="px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 border bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700 transition-colors"
            title="Fit Content expands canvas to prevent scrollbars; 100% Screen locks to window height"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
            <span>
              {heightMode === 'fit-content' ? 'Fit Content' : 'Fit Screen'}
            </span>
          </button>
        </div>

        {/* Right: Quick Vision Simulator Dropdown + Split Compare */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 gap-1.5">
            <Eye className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-500 text-[11px] hidden md:inline">Vision:</span>
            <select
              value={visionMode}
              onChange={(e) => setVisionMode(e.target.value as typeof visionMode)}
              aria-label="Simulate Vision Condition"
              className="bg-transparent text-xs font-medium text-zinc-200 focus:outline-none cursor-pointer"
            >
              {VISION_MODES.map((m) => (
                <option
                  key={m.id}
                  value={m.id}
                  className="bg-[#12141D] text-zinc-200"
                >
                  {m.shortLabel} ({m.prevalence})
                </option>
              ))}
            </select>
          </div>

          {visionMode !== 'normal' && visionMode !== 'glaucoma' && (
            <button
              onClick={() => setSplitVisionCurtain(!splitVisionCurtain)}
              className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 border transition-colors ${
                splitVisionCurtain
                  ? 'bg-white text-zinc-950 border-white font-semibold'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>50/50 Split</span>
            </button>
          )}
        </div>
      </div>

      {/* Loading Banner */}
      {isLoadingExternalUrl && (
        <div className="bg-zinc-900 border-b border-zinc-700 px-4 py-2 text-xs text-zinc-300 flex items-center gap-2.5">
          <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin shrink-0" />
          <span>
            <strong className="text-zinc-100">Connecting to URL:</strong> Hydrating scripts and capturing styles for{' '}
            <code className="font-mono text-zinc-100">{liveUrlInput}</code>...
          </span>
        </div>
      )}

      {/* URL Error Banner */}
      {urlError && (
        <div className="bg-[#181116] border-b border-red-500/30 px-4 py-2.5 text-xs text-zinc-200 flex flex-wrap items-center justify-between gap-3 shadow-lg z-30">
          <div className="flex items-center gap-2 max-w-2xl">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="leading-relaxed">
              <strong className="text-rose-300">Could not load external URL:</strong> {urlError}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => openSourceModal('html')}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Paste HTML Directly</span>
            </button>
            <button
              onClick={async () => {
                try {
                  const text = await navigator.clipboard.readText();
                  if (text && text.includes('<')) {
                    setCustomHtml(text);
                  } else {
                    openSourceModal('html');
                  }
                } catch {
                  openSourceModal('html');
                }
              }}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 font-medium text-xs transition-colors"
            >
              Paste from Clipboard
            </button>
            <button
              onClick={() => useStudioStore.setState({ urlError: null })}
              className="text-zinc-400 hover:text-zinc-200 p-1 rounded hover:bg-zinc-800"
              title="Dismiss error"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Helper Bar if Page Needs Session */}
      {isEmptySpaShell && !isLoadingExternalUrl && (
        <div className="bg-[#19150E] border-b border-amber-500/30 px-4 py-2 text-xs text-zinc-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-zinc-300 text-[11px]">
              <strong>Single-Page App Shell Detected:</strong> In your{' '}
              <code className="font-mono text-amber-300">{liveUrlInput}</code> DevTools, right-click the top{' '}
              <code className="font-mono text-zinc-100">&lt;html&gt;</code> tag $\rightarrow$ Copy outerHTML $\rightarrow$ press{' '}
              <strong className="text-white">Cmd + V</strong> here.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                try {
                  setPasteError(null);
                  const text = await navigator.clipboard.readText();
                  if (!text || !text.includes('<')) {
                    setPasteError('Copy the <html> tag from DevTools first, or press Cmd+V!');
                    return;
                  }
                  setCustomHtml(text);
                } catch {
                  setPasteError('Press Cmd + V directly on this page.');
                }
              }}
              className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-medium text-xs transition-colors"
            >
              Paste Copied DOM
            </button>
            {pasteError && (
              <span className="text-rose-400 text-[11px] font-medium">{pasteError}</span>
            )}
          </div>
        </div>
      )}

      {/* Main Scrollable Webpage Preview Area */}
      <div
        ref={viewportWrapRef}
        onMouseMove={(e) => {
          if (visionMode === 'glaucoma' && viewportWrapRef.current) {
            const rect = viewportWrapRef.current.getBoundingClientRect();
            setGlaucomaCursor({
              x: e.clientX - rect.left,
              y: e.clientY - rect.top + viewportWrapRef.current.scrollTop,
            });
          }
        }}
        className={`flex-1 overflow-auto ${
          isFullWidth
            ? 'p-0 flex flex-col items-stretch'
            : 'p-6 flex justify-center items-start'
        } relative bg-[#090A0F] transition-all`}
      >
        <div
          className={`relative w-full ${
            isFullWidth
              ? 'flex-1 rounded-none border-0'
              : 'max-w-[960px] rounded-xl border border-zinc-800 shadow-2xl overflow-hidden'
          } bg-white transition-all`}
          style={{
            minHeight: '100%',
            height:
              heightMode === 'screen'
                ? '100%'
                : `${Math.max(640, iframeHeight)}px`,
          }}
        >
          {/* Base Iframe Wrapper */}
          <div
            className="w-full h-full relative transition-all duration-150"
            style={
              splitVisionCurtain && visionMode !== 'normal'
                ? {}
                : getVisionFilterStyle()
            }
          >
            <iframe
              ref={iframeRef}
              title="AccessiVision Target Webpage Preview"
              srcDoc={currentHtmlDocString}
              onLoad={handleIframeLoad}
              style={{
                width: '100%',
                height:
                  heightMode === 'screen'
                    ? '100%'
                    : `${Math.max(640, iframeHeight)}px`,
                minHeight: '100%',
                pointerEvents: isDragging ? 'none' : 'auto',
              }}
              className="w-full border-0 block bg-white"
            />
          </div>

          {/* 50/50 Split-Screen Vision Comparison Curtain */}
          {splitVisionCurtain &&
            visionMode !== 'normal' &&
            visionMode !== 'glaucoma' && (
              <div className="absolute inset-0 pointer-events-none">
                <div
                  className="absolute inset-y-0 right-0"
                  style={{
                    left: `${splitPercent}%`,
                    backdropFilter: `url(#av-filter-${visionMode})`,
                    WebkitBackdropFilter: `url(#av-filter-${visionMode})`,
                  }}
                />
                <div
                  className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_12px_rgba(255,255,255,0.7)] pointer-events-auto cursor-ew-resize flex items-center justify-center"
                  style={{ left: `${splitPercent}%` }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const parent = e.currentTarget.parentElement;
                    if (!parent) return;
                    const moveHandler = (moveEvt: MouseEvent) => {
                      const r = parent.getBoundingClientRect();
                      const pct = Math.min(
                        95,
                        Math.max(5, ((moveEvt.clientX - r.left) / r.width) * 100)
                      );
                      setSplitPercent(Math.round(pct));
                    };
                    const upHandler = () => {
                      window.removeEventListener('mousemove', moveHandler);
                      window.removeEventListener('mouseup', upHandler);
                    };
                    window.addEventListener('mousemove', moveHandler);
                    window.addEventListener('mouseup', upHandler);
                  }}
                >
                  <div className="px-2.5 py-1 rounded-full bg-zinc-950 border border-zinc-700 text-[10px] font-semibold text-white shadow-lg whitespace-nowrap -translate-y-6">
                    Normal | {activeVisionConfig.shortLabel}
                  </div>
                </div>
              </div>
            )}

          {/* Glaucoma Tunnel Vision Mask */}
          {visionMode === 'glaucoma' && (
            <div
              className="absolute inset-0 pointer-events-none z-20"
              style={{
                background: `radial-gradient(circle 115px at ${glaucomaCursor.x}px ${glaucomaCursor.y}px, transparent 0%, rgba(5, 7, 12, 0.72) 65%, rgba(3, 4, 8, 0.97) 100%)`,
              }}
            />
          )}

          {/* SVG Overlay for Selected/Hovered Bugs & Optional Focus Path */}
          <svg
            key={`svg-overlay-${iframeLayoutVersion}`}
            className="absolute inset-0 w-full pointer-events-none z-10 overflow-hidden"
            style={{
              height:
                heightMode === 'screen'
                  ? '100%'
                  : `${Math.max(640, iframeHeight)}px`,
              minHeight: '100%',
            }}
          >
            <defs>
              <marker
                id="av-arrow-normal"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#0284C7" />
              </marker>
              <marker
                id="av-arrow-anomaly"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#E11D48" />
              </marker>
            </defs>

            <g
              transform={
                heightMode === 'screen'
                  ? `translate(${-iframeScroll.x}, ${-iframeScroll.y})`
                  : undefined
              }
            >
              {/* Highlight ONLY hovered/selected bug unless "Show All Bug Boxes" is turned on */}
              {issues
                .filter((iss) => {
                  if (iss.isPatched) return false;
                  const isFocusedOrHovered =
                    selectedIssueId === iss.id ||
                    selectedSelector === iss.selector ||
                    hoveredSelector === iss.selector;
                  return showIssueBoundingBoxes || isFocusedOrHovered;
                })
                .map((iss) => {
                  const doc = iframeRef.current?.contentDocument;
                  const r = getLiveRect(doc, iss.selector, iss.rect);

                  if (r.width <= 1 || r.height <= 1) return null;

                  const isSelected =
                    selectedIssueId === iss.id ||
                    selectedSelector === iss.selector ||
                    hoveredSelector === iss.selector;
                  const strokeColor =
                    iss.severity === 'critical' ? '#E11D48' : '#D97706';

                  return (
                    <g key={iss.id}>
                      <rect
                        x={Math.max(2, r.left - 4)}
                        y={Math.max(2, r.top - 4)}
                        width={r.width + 8}
                        height={r.height + 8}
                        rx={8}
                        fill={
                          isSelected
                            ? 'rgba(225, 29, 72, 0.14)'
                            : 'rgba(225, 29, 72, 0.04)'
                        }
                        stroke={strokeColor}
                        strokeWidth={isSelected ? 2.5 : 1.5}
                        strokeDasharray={isSelected ? 'none' : '5 3'}
                        className="pointer-events-auto cursor-pointer transition-all"
                        onClick={() => selectIssue(iss.id, iss.selector)}
                      />
                    </g>
                  );
                })}

              {/* Focus Map Overlay (Only when enabled or in Keyboard Flow tab) */}
              {showFocusMapOverlay && (
                <>
                  {focusStops.map((stop, idx) => {
                    if (idx === 0) return null;
                    const prev = focusStops[idx - 1];
                    const doc = iframeRef.current?.contentDocument;
                    const prevR = getLiveRect(doc, prev.selector, prev.rect);
                    const stopR = getLiveRect(doc, stop.selector, stop.rect);

                    const x1 = prevR.left + prevR.width / 2;
                    const y1 = prevR.top + prevR.height / 2;
                    const x2 = stopR.left + stopR.width / 2;
                    const y2 = stopR.top + stopR.height / 2;

                    const midX = (x1 + x2) / 2;
                    const midY = (y1 + y2) / 2 - 24;

                    const isAnomaly =
                      stop.isPositiveTabIndexAnomaly ||
                      stop.isVisualOrderMismatch ||
                      stop.isInsideModalTrap;

                    return (
                      <path
                        key={`focus-edge-${prev.index}-${stop.index}`}
                        d={`M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`}
                        fill="none"
                        stroke={isAnomaly ? '#E11D48' : '#0284C7'}
                        strokeWidth={activeFocusStepIndex === stop.index ? 3 : 2}
                        strokeDasharray={isAnomaly ? '6 4' : 'none'}
                        markerEnd={
                          isAnomaly
                            ? 'url(#av-arrow-anomaly)'
                            : 'url(#av-arrow-normal)'
                        }
                        opacity={0.85}
                      />
                    );
                  })}

                  {focusStops.map((stop) => {
                    const doc = iframeRef.current?.contentDocument;
                    const stopR = getLiveRect(doc, stop.selector, stop.rect);
                    const cx = stopR.left + 10;
                    const cy = stopR.top + 10;
                    const isCurrentStep = activeFocusStepIndex === stop.index;
                    const isAnomaly =
                      stop.isPositiveTabIndexAnomaly ||
                      stop.isVisualOrderMismatch ||
                      !stop.hasFocusRing;

                    return (
                      <g
                        key={`focus-node-${stop.index}`}
                        transform={`translate(${cx}, ${cy})`}
                        className="pointer-events-auto cursor-pointer"
                        onClick={() => onFocusStopSelect(stop.index)}
                      >
                        {isCurrentStep && (
                          <circle
                            r={16}
                            fill="none"
                            stroke="#0D9488"
                            strokeWidth={3}
                            opacity={0.85}
                          />
                        )}
                        <circle
                          r={11}
                          fill={
                            isCurrentStep
                              ? '#0D9488'
                              : isAnomaly
                              ? '#E11D48'
                              : '#0284C7'
                          }
                          stroke="#FFFFFF"
                          strokeWidth={2}
                        />
                        <text
                          textAnchor="middle"
                          dy="3.5"
                          fill="#FFFFFF"
                          fontSize="10"
                          fontWeight="700"
                          fontFamily="JetBrains Mono, monospace"
                        >
                          {stop.index}
                        </text>
                      </g>
                    );
                  })}
                </>
              )}

              {/* Optional Contrast Badges Overlay */}
              {showContrastOverlay &&
                contrastReports.map((c) => {
                  const doc = iframeRef.current?.contentDocument;
                  const cR = getLiveRect(doc, c.selector, c.rect);
                  const ratio = c.worstGradientRatio ?? c.wcag21Ratio;
                  const pass = c.passesAA && c.passesApca;
                  return (
                    <g
                      key={c.id}
                      transform={`translate(${Math.max(
                        6,
                        cR.left + cR.width - 102
                      )}, ${Math.max(4, cR.top - 6)})`}
                    >
                      <rect
                        x={0}
                        y={0}
                        width={106}
                        height={18}
                        rx={4}
                        fill={pass ? '#065F46' : '#881337'}
                        stroke={pass ? '#10B981' : '#F43F5E'}
                        strokeWidth={1}
                      />
                      <text
                        x={6}
                        y={12}
                        fill="#FFFFFF"
                        fontSize="9.5"
                        fontWeight="700"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {ratio}:1 • Lc {Math.round(Math.abs(c.apcaLc))}
                      </text>
                    </g>
                  );
                })}
            </g>
          </svg>
        </div>
      </div>

      {/* Bottom Screen Reader & Tab Stepper Bar */}
      <div className="h-12 bg-[#0E1017] border-t border-zinc-800 px-4 flex items-center justify-between gap-3 text-xs z-20">
        {/* Left: Step Through Page with Keyboard */}
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-500 text-[11px] font-medium mr-1 hidden sm:inline">
            Tab Simulation:
          </span>

          <button
            onClick={() => stepKeyboardFocus(-1)}
            className="px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 flex items-center gap-1 transition-colors"
            title="Move to previous focusable element (Shift + Tab)"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-zinc-400" />
            <span>Shift+Tab</span>
          </button>

          <button
            onClick={() => stepKeyboardFocus(1)}
            className="px-3 py-1 rounded-md bg-white hover:bg-zinc-200 text-xs font-semibold text-zinc-950 flex items-center gap-1.5 transition-colors shadow-sm"
            title="Move to next focusable element (Tab key)"
          >
            <span>Next (Tab)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              if (!showFocusMapOverlay) setShowFocusMapOverlay(true);
              setIsAutoPlayingFocus(!isAutoPlayingFocus);
            }}
            className={`px-2.5 py-1 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              isAutoPlayingFocus
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
            }`}
          >
            {isAutoPlayingFocus ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-zinc-400" />
                <span>Auto-Step</span>
              </>
            )}
          </button>

          <button
            onClick={triggerEnterOnFocused}
            disabled={!activeFocusStepIndex}
            className="px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 border border-zinc-800 text-xs text-zinc-300 hidden lg:flex items-center gap-1"
            title="Press Enter on the focused element"
          >
            <CornerDownLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>Trigger Click</span>
          </button>
        </div>

        {/* Right: What a Blind User Hears (Screen Reader Box) */}
        <div className="flex items-center gap-2.5 flex-1 justify-end min-w-0">
          <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 rounded-lg px-3 py-1 max-w-lg w-full min-w-0">
            <span className="text-[11px] font-semibold text-zinc-300 shrink-0">
              Screen Reader:
            </span>
            {latestAnnouncement ? (
              <div className="truncate text-xs text-zinc-200 flex items-center gap-2 min-w-0">
                <span className="truncate font-mono text-[11px]">
                  &ldquo;{latestAnnouncement.voiceOverOutput}&rdquo;
                </span>
                {latestAnnouncement.warning && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 shrink-0 font-medium">
                    Missing Label
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs text-zinc-500 truncate">
                Press <strong>Next (Tab)</strong> to inspect synthesized voice output
              </span>
            )}
          </div>

          <InfoTooltip
            title="Spoken Speech Synthesis"
            description="Uses Web Speech API to vocalize live screen-reader announcements as you step through the focus tree."
            align="right"
          >
            <button
              onClick={() => setVoiceSynthEnabled(!voiceSynthEnabled)}
              className={`p-1.5 rounded-lg border transition-colors shrink-0 ${
                voiceSynthEnabled
                  ? 'bg-zinc-800 border-zinc-600 text-white'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
              aria-label="Toggle Spoken Audio"
            >
              {voiceSynthEnabled ? (
                <Volume2 className="w-3.5 h-3.5" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
            </button>
          </InfoTooltip>
        </div>
      </div>
    </div>
  );
};
