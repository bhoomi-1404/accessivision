import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Code2,
  Copy,
  Download,
  Eye,
  GitCompare,
  Keyboard,
  Palette,
  RotateCcw,
  Sparkles,
  Volume2,
  Wand2,
} from 'lucide-react';
import { useStudioStore } from '../store/useStudioStore';
import {
  A11yIssue,
  IssueCategory,
  StudioInspectorTab,
} from '../types/a11y';
import { VISION_MODES } from '../engine/visionConfigs';
import { GlossaryBadge, InfoTooltip } from './InfoTooltip';

interface InspectorPanelProps {
  width?: number;
  onApplySingleFix: (issue: A11yIssue) => void;
  onRevertSingleFix: (issueId: string) => void;
  onApplyCustomContrast: (selector: string, fgHex: string, bgHex?: string) => void;
  onFocusStopSelect: (stopIndex: number) => void;
  onSelectDomElement: (selector: string) => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  width,
  onApplySingleFix,
  onRevertSingleFix,
  onApplyCustomContrast,
  onFocusStopSelect,
  onSelectDomElement,
}) => {
  const {
    activeTab,
    categoryFilter,
    issues,
    focusStops,
    contrastReports,
    a11yTree,
    announcements,
    visionMode,
    splitVisionCurtain,
    selectedIssueId,
    activeFocusStepIndex,
    appliedPatches,
    setActiveTab,
    setCategoryFilter,
    selectIssue,
    setHoveredSelector,
    setVisionMode,
    setSplitVisionCurtain,
    clearAnnouncements,
  } = useStudioStore();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedCodeIds, setExpandedCodeIds] = useState<Record<string, boolean>>({});
  const [codeFormat, setCodeFormat] = useState<'jsx' | 'html'>('jsx');
  const [contrastCodeView, setContrastCodeView] = useState<Record<string, 'css' | 'html'>>({});

  const toggleCodeExpand = (id: string) => {
    setExpandedCodeIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const filteredIssues =
    categoryFilter === 'all'
      ? issues
      : issues.filter((i) => i.category === categoryFilter);

  const unpatchedIssuesCount = issues.filter((i) => !i.isPatched).length;
  const failingContrastCount = contrastReports.filter(
    (c) => !c.passesAA || !c.passesApca
  ).length;

  const generateUnifiedGitDiff = () => {
    if (appliedPatches.length === 0) {
      return '# No fixes applied yet.\n# Click "Fix This Issue" on any bug card to see the exact code changes here.';
    }
    const lines: string[] = [
      'diff --git a/src/components/Page.tsx b/src/components/Page.tsx',
      '--- a/src/components/Page.tsx',
      '+++ b/src/components/Page.tsx',
    ];
    appliedPatches.forEach((p, i) => {
      lines.push(`\n@@ -${(i + 1) * 10},2 +${(i + 1) * 10},2 @@ /* Fix: ${p.summary} */`);
      lines.push(`- ${p.beforeHtml}`);
      lines.push(`+ ${codeFormat === 'jsx' ? p.afterJsx : p.afterHtml}`);
    });
    return lines.join('\n');
  };

  const downloadPatchFile = () => {
    const content = generateUnifiedGitDiff();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'accessibility-fixes.patch';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Simplified 4 Primary Tabs
  const primaryTabs: {
    id: StudioInspectorTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
    {
      id: 'issues',
      label: 'Issues & Fixes',
      icon: <Sparkles className="w-4 h-4" />,
      badge: unpatchedIssuesCount,
    },
    {
      id: 'focus-map',
      label: 'Keyboard Flow',
      icon: <Keyboard className="w-4 h-4" />,
      badge: focusStops.length,
    },
    {
      id: 'contrast',
      label: 'Contrast & Vision',
      icon: <Palette className="w-4 h-4" />,
      badge: failingContrastCount,
    },
    {
      id: 'screen-reader',
      label: 'Screen Reader',
      icon: <Volume2 className="w-4 h-4" />,
    },
  ];

  return (
    <aside
      style={{ width: width ? `${width}px` : undefined }}
      className={`${width ? '' : 'w-[460px] xl:w-[500px]'} border-l border-slate-800 bg-[#0B0F17] flex flex-col h-full select-none shrink-0`}
    >
      {/* Clean 4-Tab Header */}
      <div className="grid grid-cols-4 border-b border-slate-800 bg-[#080C12] px-2 pt-2 gap-1.5">
        {primaryTabs.map((tab) => {
          const active =
            activeTab === tab.id ||
            (tab.id === 'issues' && activeTab === 'git-diff') ||
            (tab.id === 'contrast' && activeTab === 'vision-lab');
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-t-xl text-xs font-semibold transition-all border-b-2 ${
                active
                  ? 'bg-[#111823] text-teal-300 border-teal-500'
                  : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {tab.icon}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      active
                        ? 'bg-teal-500/25 text-teal-200 border border-teal-500/40'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="mt-1 truncate max-w-full">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* CODE DIFF VIEW (When user clicks "View Code Changes") */}
      {activeTab === 'git-diff' && (
        <div className="flex-1 flex flex-col overflow-hidden p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setActiveTab('issues')}
              className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Issues List</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => copyText(generateUnifiedGitDiff(), 'git-diff-all')}
                className="px-3 py-1.5 rounded-lg bg-[#131B26] hover:bg-[#1B2636] border border-slate-700 text-xs text-slate-200 flex items-center gap-1.5"
              >
                {copiedId === 'git-diff-all' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy All Code</span>
                  </>
                )}
              </button>

              <button
                onClick={downloadPatchFile}
                className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-xs font-semibold text-white flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .patch</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-400 mb-3">
            Below are the exact HTML / React JSX lines changed when fixing the accessibility issues on the page:
          </p>

          <pre className="flex-1 rounded-xl bg-[#070A0F] border border-slate-800 p-3.5 font-mono text-xs text-slate-200 overflow-auto leading-relaxed">
            {generateUnifiedGitDiff()}
          </pre>
        </div>
      )}

      {/* TAB 1: ISSUES & FIXES (Clean, Plain-English Cards + Tooltips) */}
      {activeTab === 'issues' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Simple Filter Row */}
          <div className="p-3.5 border-b border-slate-800 bg-[#0E141E] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {(
                [
                  { id: 'all', label: 'All Issues' },
                  { id: 'focus-keyboard', label: 'Keyboard' },
                  { id: 'contrast-apca', label: 'Contrast' },
                  { id: 'semantics-aria', label: 'Labels (ARIA)' },
                ] as { id: IssueCategory | 'all'; label: string }[]
              ).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    categoryFilter === cat.id
                      ? 'bg-teal-600 text-white'
                      : 'bg-[#151E2C] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {appliedPatches.length > 0 && (
              <button
                onClick={() => setActiveTab('git-diff')}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-1 shrink-0 hover:bg-emerald-500/25"
              >
                <GitCompare className="w-3 h-3" />
                <span>Diff ({appliedPatches.length})</span>
              </button>
            )}
          </div>

          {/* Issues List */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
            {filteredIssues.length === 0 ? (
              <div className="text-center py-12 px-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-white">
                  All Accessibility Checks Passed!
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  No remaining issues in this category.
                </p>
              </div>
            ) : (
              filteredIssues.map((issue) => {
                const isSelected = selectedIssueId === issue.id;
                const isCodeOpen = Boolean(expandedCodeIds[issue.id]);
                const sevStyle =
                  issue.severity === 'critical'
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    : issue.severity === 'serious'
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    : 'bg-sky-500/15 text-sky-300 border-sky-500/30';

                const targetSnippet =
                  codeFormat === 'jsx' ? issue.afterJsx : issue.afterHtml;

                return (
                  <div
                    key={issue.id}
                    onMouseEnter={() => setHoveredSelector(issue.selector)}
                    onMouseLeave={() => setHoveredSelector(null)}
                    onClick={() => {
                      selectIssue(issue.id, issue.selector);
                      onSelectDomElement(issue.selector);
                    }}
                    className={`rounded-xl border p-4 transition-all cursor-pointer ${
                      issue.isPatched
                        ? 'bg-emerald-950/15 border-emerald-500/30'
                        : isSelected
                        ? 'bg-[#141E2D] border-teal-500 shadow-lg'
                        : 'bg-[#111823] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Top Badges with Tooltips for Abbreviations */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${sevStyle}`}
                        >
                          {issue.severity}
                        </span>

                        <GlossaryBadge
                          termKey="WCAG"
                          displayText={issue.wcagCriteria}
                          className="text-[11px] font-mono text-slate-300 bg-[#090D14] px-2 py-0.5 rounded border border-slate-800"
                          align="left"
                        />
                      </div>

                      {issue.isPatched && (
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Fixed on Page
                        </span>
                      )}
                    </div>

                    {/* Plain-English Problem Title & Impact */}
                    <h3 className="text-sm font-bold text-white leading-snug">
                      {issue.title}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                      {issue.impactSummary}
                    </p>

                    {/* How to Fix Explanation */}
                    <div className="mt-3 p-3 rounded-lg bg-teal-950/30 border border-teal-500/25 text-xs text-teal-100 leading-relaxed">
                      <strong className="text-teal-300">How we fix this: </strong>
                      {issue.aiExplanation}
                    </div>

                    {/* Action Row: 1-Click Fix + Collapsible Code Toggle */}
                    <div
                      className="mt-3.5 flex items-center justify-between gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {!issue.isPatched ? (
                        <button
                          onClick={() => onApplySingleFix(issue)}
                          className="flex-1 py-2 px-3.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                        >
                          <Wand2 className="w-3.5 h-3.5" />
                          <span>Fix This Issue on Page</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onRevertSingleFix(issue.id)}
                          className="flex-1 py-2 px-3.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Undo Fix</span>
                        </button>
                      )}

                      <button
                        onClick={() => toggleCodeExpand(issue.id)}
                        className="py-2 px-3 rounded-lg bg-[#182232] hover:bg-[#1F2C40] border border-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors"
                      >
                        <span>{isCodeOpen ? 'Hide Code' : 'View Code'}</span>
                        {isCodeOpen ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Collapsible Code Snippet (Keeps Cards Clean Until Clicked!) */}
                    {isCodeOpen && (
                      <div
                        className="mt-3 pt-3 border-t border-slate-800 space-y-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 bg-[#090D14] p-0.5 rounded border border-slate-800 text-[11px]">
                            <button
                              onClick={() => setCodeFormat('jsx')}
                              className={`px-2 py-0.5 rounded ${
                                codeFormat === 'jsx'
                                  ? 'bg-teal-600 text-white'
                                  : 'text-slate-400'
                              }`}
                            >
                              React JSX
                            </button>
                            <button
                              onClick={() => setCodeFormat('html')}
                              className={`px-2 py-0.5 rounded ${
                                codeFormat === 'html'
                                  ? 'bg-teal-600 text-white'
                                  : 'text-slate-400'
                              }`}
                            >
                              HTML
                            </button>
                          </div>

                          <button
                            onClick={() => copyText(targetSnippet, issue.id)}
                            className="text-xs text-teal-300 hover:text-teal-200 flex items-center gap-1"
                          >
                            {copiedId === issue.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Fixed Code</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="rounded-lg bg-[#080B11] border border-slate-800 p-2.5 font-mono text-[11px] overflow-x-auto space-y-1.5">
                          <div className="text-rose-400/90 line-through">
                            - {issue.beforeHtml}
                          </div>
                          <div className="text-emerald-400">+ {targetSnippet}</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: KEYBOARD FLOW (Simple Step-by-Step Tab Order List) */}
      {activeTab === 'focus-map' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-[#0E141E]">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">
                Keyboard Tab Order ({focusStops.length} Stops)
              </h2>
              <GlossaryBadge
                termKey="tabindex"
                displayText="What is tabindex?"
                className="text-xs text-teal-300"
                align="right"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              This list shows the exact order a user moves through the page when pressing the{' '}
              <strong>Tab</strong> key. Click any step to test it on the page.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
            {focusStops.map((stop) => {
              const isCurrent = activeFocusStepIndex === stop.index;
              const hasBug =
                stop.isPositiveTabIndexAnomaly ||
                stop.isVisualOrderMismatch ||
                !stop.hasFocusRing ||
                stop.isMissingAccessibleName;

              return (
                <div
                  key={stop.index}
                  onClick={() => onFocusStopSelect(stop.index)}
                  onMouseEnter={() => setHoveredSelector(stop.selector)}
                  onMouseLeave={() => setHoveredSelector(null)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    isCurrent
                      ? 'bg-teal-950/40 border-teal-500 shadow-md'
                      : hasBug
                      ? 'bg-rose-950/15 border-rose-500/35 hover:border-rose-500/60'
                      : 'bg-[#111823] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                      isCurrent
                        ? 'bg-teal-600 text-white'
                        : hasBug
                        ? 'bg-rose-600 text-white'
                        : 'bg-sky-600 text-white'
                    }`}
                  >
                    {stop.index}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white truncate">
                        {stop.accessibleName}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#080B11] text-slate-300 border border-slate-800 shrink-0">
                        &lt;{stop.tagName}&gt;
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {stop.isPositiveTabIndexAnomaly && (
                        <GlossaryBadge
                          termKey="tabindex"
                          displayText={`Out-of-order tabindex="${stop.rawTabIndex}"`}
                          className="text-[11px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          align="left"
                        />
                      )}
                      {stop.isVisualOrderMismatch && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Jumps backwards on screen ↑
                        </span>
                      )}
                      {!stop.hasFocusRing && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Missing focus outline ring
                        </span>
                      )}
                      {!hasBug && (
                        <span className="text-[11px] text-emerald-400">
                          ✓ Normal focus order
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: CONTRAST & VISION SIMULATOR (Combined for Simplicity!) */}
      {activeTab === 'contrast' || activeTab === 'vision-lab' ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Section A: Vision Deficiency Simulator */}
          <div className="p-4 rounded-xl bg-[#111823] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-teal-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                  1. Color Blindness &amp; Vision Simulator
                </h2>
              </div>
              {visionMode !== 'normal' && visionMode !== 'glaucoma' && (
                <button
                  onClick={() => setSplitVisionCurtain(!splitVisionCurtain)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                    splitVisionCurtain
                      ? 'bg-teal-600 text-white border-teal-500'
                      : 'bg-[#090D14] text-slate-300 border-slate-700'
                  }`}
                >
                  {splitVisionCurtain ? '50/50 Split: ON' : 'Compare 50/50'}
                </button>
              )}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Click any condition below to see how users with color blindness or eye conditions experience the page:
            </p>

            <div className="grid grid-cols-2 gap-2">
              {VISION_MODES.map((m) => {
                const active = visionMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setVisionMode(m.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      active
                        ? 'bg-teal-950/50 border-teal-500 text-white shadow-sm'
                        : 'bg-[#0B0F17] border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold truncate">{m.shortLabel}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {m.prevalence}
                    </div>
                  </button>
                );
              })}
            </div>

            {visionMode !== 'normal' && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 leading-relaxed">
                <strong>What to look for:</strong>{' '}
                {VISION_MODES.find((m) => m.id === visionMode)?.uxImpact}
              </div>
            )}
          </div>

          {/* Section B: Text Contrast Checker */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                2. Text Contrast Checker ({contrastReports.length} Elements)
              </h2>
              <div className="flex items-center gap-2 text-xs">
                <GlossaryBadge
                  termKey="AA"
                  displayText="What is AA?"
                  className="text-teal-300"
                  align="right"
                />
                <GlossaryBadge
                  termKey="APCA"
                  displayText="What is APCA Lc?"
                  className="text-teal-300"
                  align="right"
                />
              </div>
            </div>

            {contrastReports.map((c) => {
              const effectiveRatio = c.worstGradientRatio ?? c.wcag21Ratio;
              const passBoth = c.passesAA && c.passesApca;

              return (
                <div
                  key={c.id}
                  onMouseEnter={() => setHoveredSelector(c.selector)}
                  onMouseLeave={() => setHoveredSelector(null)}
                  onClick={() => onSelectDomElement(c.selector)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    passBoth
                      ? 'bg-[#111823] border-slate-800'
                      : 'bg-rose-950/15 border-rose-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-white truncate">
                      “{c.textPreview}”
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <GlossaryBadge
                        termKey="AA"
                        displayText={`${effectiveRatio}:1 ${
                          c.passesAAA ? 'AAA' : c.passesAA ? 'Pass AA' : 'Low Contrast'
                        }`}
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          c.passesAA
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                        align="right"
                      />
                      <GlossaryBadge
                        termKey="Lc"
                        displayText={`Lc ${Math.round(Math.abs(c.apcaLc))}`}
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          c.passesApca
                            ? 'bg-teal-500/20 text-teal-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                        align="right"
                      />
                    </div>
                  </div>

                  {/* Color Swatches */}
                  <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-3.5 h-3.5 rounded border border-white/20 inline-block"
                          style={{ backgroundColor: c.fgHex }}
                        />
                        Text {c.fgHex}
                      </span>
                      <span>on</span>
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-3.5 h-3.5 rounded border border-white/20 inline-block"
                          style={{
                            backgroundColor: c.worstGradientBgHex || c.bgHex,
                          }}
                        />
                        Bg {c.worstGradientBgHex || c.bgHex}
                      </span>
                    </div>
                    <span className="text-[11px]">{c.fontSizePx}px font</span>
                  </div>

                  {c.isDynamicGradientOrImage && (
                    <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200">
                      ⚡ Background Gradient Warning: Contrast drops to{' '}
                      <strong>{effectiveRatio}:1</strong> over the lightest part of the gradient.
                    </div>
                  )}

                  {!passBoth && (
                    <div
                      className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-col gap-2.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* 1. Clear Accessibility Issue Diagnosis */}
                      <div className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/25 text-[11px] text-rose-200 leading-relaxed">
                        <div className="font-semibold text-rose-300 flex items-center gap-1.5 mb-0.5">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>Why this fails:</span>
                        </div>
                        <p className="text-slate-300">
                          {c.explanation ||
                            `Text (${c.fgHex}) on background (${c.worstGradientBgHex || c.bgHex}) achieves only ${effectiveRatio}:1 contrast (WCAG AA requires ≥ ${c.isLargeText ? '3.0' : '4.5'}:1).`}
                        </p>
                      </div>

                      {/* 2. Current Code vs. Suggested Code Fix Box */}
                      <div className="rounded-xl bg-[#080B11] border border-slate-800 p-2.5 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
                            <Code2 className="w-3.5 h-3.5 text-teal-400" />
                            <span>Code Suggestion</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Format Switcher: CSS vs JSX */}
                            <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-md p-0.5 text-[10px]">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setContrastCodeView((prev) => ({ ...prev, [c.id]: 'css' }));
                                }}
                                className={`px-1.5 py-0.5 rounded font-mono transition-colors ${
                                  (contrastCodeView[c.id] || 'css') === 'css'
                                    ? 'bg-teal-600 text-white font-bold'
                                    : 'text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                CSS
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setContrastCodeView((prev) => ({ ...prev, [c.id]: 'html' }));
                                }}
                                className={`px-1.5 py-0.5 rounded font-mono transition-colors ${
                                  contrastCodeView[c.id] === 'html'
                                    ? 'bg-teal-600 text-white font-bold'
                                    : 'text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                JSX
                              </button>
                            </div>

                            {/* Copy Code Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const isHtml = contrastCodeView[c.id] === 'html';
                                const textToCopy = isHtml
                                  ? c.afterHtmlBg || c.afterHtmlFg || `<${c.tagName} style="color: ${c.fgHex}; background-color: ${c.suggestedBgHex};">`
                                  : (c.cssSuggestedBg || c.cssSuggestedFg || `color: ${c.fgHex};\nbackground-color: ${c.suggestedBgHex};`);
                                copyText(textToCopy, `code-${c.id}`);
                              }}
                              className="text-[11px] text-teal-300 hover:text-teal-200 flex items-center gap-1 bg-slate-800/90 hover:bg-slate-700 px-2 py-0.5 rounded border border-slate-700 transition-colors"
                            >
                              {copiedId === `code-${c.id}` ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-300">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy Code</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Code Body */}
                        {(contrastCodeView[c.id] || 'css') === 'css' ? (
                          <div className="font-mono text-[11px] p-2 rounded-lg bg-[#05080E] border border-slate-800/80 space-y-1.5 text-slate-300 overflow-x-auto">
                            <div>
                              <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">
                                Current Code ({effectiveRatio}:1 Fails):
                              </div>
                              <div className="text-rose-400/90 pl-2 border-l-2 border-rose-500/50 whitespace-pre">
                                {c.cssCurrent || `color: ${c.fgHex};\nbackground-color: ${c.bgHex};`}
                              </div>
                            </div>

                            <div className="pt-1.5 border-t border-slate-800/80 space-y-1.5">
                              <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                                Suggested Fix Options:
                              </div>
                              {c.suggestedBgHex !== (c.worstGradientBgHex || c.bgHex) && (
                                <div className="text-emerald-400 pl-2 border-l-2 border-emerald-500/60 whitespace-pre">
                                  <span className="text-[10px] text-teal-300/80 font-sans font-medium block">
                                    Option A (Fix background to accessible shade):
                                  </span>
                                  {c.cssSuggestedBg || `color: ${c.fgHex};\nbackground-color: ${c.suggestedBgHex};`}
                                </div>
                              )}
                              {c.suggestedFgHex !== c.fgHex && (
                                <div className="text-emerald-400 pl-2 border-l-2 border-emerald-500/60 whitespace-pre">
                                  <span className="text-[10px] text-teal-300/80 font-sans font-medium block">
                                    Option B (Fix text to accessible contrast):
                                  </span>
                                  {c.cssSuggestedFg || `color: ${c.suggestedFgHex};\nbackground-color: ${c.worstGradientBgHex || c.bgHex};`}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="font-mono text-[11px] p-2 rounded-lg bg-[#05080E] border border-slate-800/80 space-y-1.5 text-slate-300 overflow-x-auto">
                            <div>
                              <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">
                                Current Element:
                              </div>
                              <div className="text-rose-400/90 line-through pl-2 border-l-2 border-rose-500/50">
                                - {c.beforeHtml || `<${c.tagName} style="color: ${c.fgHex}; background-color: ${c.bgHex}">`}
                              </div>
                            </div>

                            <div className="pt-1.5 border-t border-slate-800/80">
                              <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">
                                Suggested Element:
                              </div>
                              <div className="text-emerald-400 pl-2 border-l-2 border-emerald-500/60">
                                + {c.afterHtmlBg || c.afterHtmlFg || `<${c.tagName} style="color: ${c.fgHex}; background-color: ${c.suggestedBgHex}">`}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 3. Live Hot-Patch Buttons */}
                      <div className="flex flex-col gap-1.5 pt-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-medium text-[11px]">Apply Fix Live in Sandbox:</span>
                          <span className="text-[10px] text-teal-400/90 font-mono">
                            Target ≥ {c.isLargeText ? '3.0:1' : '4.5:1'} AA
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {/* Option 1: Fix Text Color */}
                          {c.suggestedFgHex !== c.fgHex && (
                            <button
                              onClick={() =>
                                onApplyCustomContrast(c.selector, c.suggestedFgHex, undefined)
                              }
                              className="flex-1 min-w-[130px] px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-[0.98] border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
                              title={`Change text color to accessible ${c.suggestedFgHex}`}
                            >
                              <span
                                className="w-3.5 h-3.5 rounded border border-white/20 shrink-0 inline-block"
                                style={{ backgroundColor: c.suggestedFgHex }}
                              />
                              <span>Fix Text ({c.suggestedFgHex})</span>
                            </button>
                          )}

                          {/* Option 2: Fix Background Color */}
                          {c.suggestedBgHex !== (c.worstGradientBgHex || c.bgHex) && (
                            <button
                              onClick={() =>
                                onApplyCustomContrast(c.selector, c.fgHex, c.suggestedBgHex)
                              }
                              className="flex-1 min-w-[130px] px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 active:scale-[0.98] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
                              title={`Adjust background to accessible ${c.suggestedBgHex} (keeps ${c.fgHex} text)`}
                            >
                              <Wand2 className="w-3.5 h-3.5 shrink-0" />
                              <span
                                className="w-3.5 h-3.5 rounded border border-white/20 shrink-0 inline-block"
                                style={{ backgroundColor: c.suggestedBgHex }}
                              />
                              <span>Fix Background ({c.suggestedBgHex})</span>
                            </button>
                          )}

                          {/* Fallback if neither differed */}
                          {c.suggestedFgHex === c.fgHex && c.suggestedBgHex === (c.worstGradientBgHex || c.bgHex) && (
                            <button
                              onClick={() =>
                                onApplyCustomContrast(c.selector, '#0F172A', undefined)
                              }
                              className="w-full px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5"
                            >
                              <Wand2 className="w-3 h-3" />
                              <span>Fix Color Live (#0F172A)</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* TAB 4: SCREEN READER PREVIEW */}
      {activeTab === 'screen-reader' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-[#0E141E] flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">
                  Screen Reader Simulator
                </h2>
                <GlossaryBadge
                  termKey="ARIA"
                  displayText="What is ARIA?"
                  className="text-xs text-teal-300"
                  align="right"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                See what blind users hear when navigating your page with macOS VoiceOver or Windows NVDA.
              </p>
            </div>
            {announcements.length > 0 && (
              <button
                onClick={clearAnnouncements}
                className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-[#151E2C]"
              >
                Clear
              </button>
            )}
          </div>

          {/* Top Half: Spoken Log */}
          <div className="h-44 border-b border-slate-800 overflow-y-auto p-3.5 space-y-2 bg-[#080B11]">
            <div className="text-[11px] font-semibold text-teal-400">
              Spoken Output Log (Click any element on the page to test):
            </div>
            {announcements.length === 0 ? (
              <p className="text-xs text-slate-500 py-5 text-center">
                Click any element on the webpage or press <strong>Next (Tab)</strong> at the bottom to see what a screen reader speaks.
              </p>
            ) : (
              announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="p-2.5 rounded-xl bg-[#111823] border border-slate-800 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-slate-200">
                    <span>
                      <strong className="text-teal-300">Spoken:</strong> “
                      {ann.voiceOverOutput}”
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {ann.timestamp}
                    </span>
                  </div>
                  {ann.warning && (
                    <div className="text-[11px] text-rose-300 flex items-center gap-1.5 pt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{ann.warning}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Bottom Half: Page Elements List */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Page Elements Read by Screen Readers ({a11yTree.length})</span>
              <GlossaryBadge
                termKey="aria-live"
                displayText="What is aria-live?"
                className="text-teal-300"
                align="right"
              />
            </div>

            {a11yTree.map((node) => (
              <div
                key={node.id}
                onClick={() => onSelectDomElement(node.selector)}
                onMouseEnter={() => setHoveredSelector(node.selector)}
                onMouseLeave={() => setHoveredSelector(null)}
                className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                  node.hasMissingName
                    ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                    : 'bg-[#111823] border-slate-800 hover:border-slate-700 text-slate-200'
                }`}
              >
                <div className="truncate flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-teal-500/15 text-teal-300 text-[11px] font-mono font-semibold">
                    {node.role}
                  </span>
                  <span className="truncate font-medium">
                    {node.accessibleName
                      ? `“${node.accessibleName}”`
                      : '⚠️ Missing Label (Announced as blank!)'}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-500 shrink-0">
                  &lt;{node.tagName}&gt;
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};
