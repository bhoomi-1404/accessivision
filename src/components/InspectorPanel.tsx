import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
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
  Volume2,
  Wrench,
} from 'lucide-react';
import { useStudioStore } from '../store/useStudioStore';
import {
  A11yIssue,
  IssueCategory,
  StudioInspectorTab,
} from '../types/a11y';
import { VISION_MODES } from '../engine/visionConfigs';
import { GlossaryBadge } from './InfoTooltip';

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
      return '# No fixes applied yet.\n# Click "Apply Fix" on any issue card to preview the code patch here.';
    }
    const lines: string[] = [
      'diff --git a/src/components/Page.tsx b/src/components/Page.tsx',
      '--- a/src/components/Page.tsx',
      '+++ b/src/components/Page.tsx',
    ];
    appliedPatches.forEach((p, i) => {
      lines.push(`\n@@ -${(i + 1) * 10},2 +${(i + 1) * 10},2 @@ /* Patch: ${p.summary} */`);
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
    a.download = 'accessibility-remediation.patch';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Primary Navigation Tabs
  const primaryTabs: {
    id: StudioInspectorTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
    {
      id: 'issues',
      label: 'Issues',
      icon: <AlertCircle className="w-3.5 h-3.5" />,
      badge: unpatchedIssuesCount,
    },
    {
      id: 'focus-map',
      label: 'Focus Order',
      icon: <Keyboard className="w-3.5 h-3.5" />,
      badge: focusStops.length,
    },
    {
      id: 'contrast',
      label: 'Contrast',
      icon: <Palette className="w-3.5 h-3.5" />,
      badge: failingContrastCount,
    },
    {
      id: 'screen-reader',
      label: 'Screen Reader',
      icon: <Volume2 className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <aside
      style={{ width: width ? `${width}px` : undefined }}
      className={`${width ? '' : 'w-[460px] xl:w-[500px]'} border-l border-zinc-800 bg-[#0E1017] flex flex-col h-full select-none shrink-0`}
    >
      {/* Modern Segmented Navigation Header */}
      <div className="border-b border-zinc-800 bg-[#0B0D13] p-1.5">
        <div className="grid grid-cols-4 gap-1 bg-zinc-900/60 p-1 rounded-lg border border-zinc-800/80">
          {primaryTabs.map((tab) => {
            const active =
              activeTab === tab.id ||
              (tab.id === 'issues' && activeTab === 'git-diff') ||
              (tab.id === 'contrast' && activeTab === 'vision-lab');
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-1 rounded-md text-xs font-medium transition-all ${
                  active
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                {tab.icon}
                <span className="truncate">{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`text-[10px] font-mono px-1 py-0.2 rounded-full leading-none ${
                      active
                        ? 'bg-zinc-700 text-zinc-200 font-semibold'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* CODE DIFF VIEW */}
      {activeTab === 'git-diff' && (
        <div className="flex-1 flex flex-col overflow-hidden p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setActiveTab('issues')}
              className="text-xs font-medium text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Issues</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => copyText(generateUnifiedGitDiff(), 'git-diff-all')}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 flex items-center gap-1.5 transition-colors"
              >
                {copiedId === 'git-diff-all' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Copy Patch</span>
                  </>
                )}
              </button>

              <button
                onClick={downloadPatchFile}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-xs font-semibold text-zinc-950 flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export .patch</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-zinc-400 mb-3">
            Unified Git diff generated from accessibility remediations applied in the live DOM:
          </p>

          <pre className="flex-1 rounded-lg bg-[#080A0F] border border-zinc-800 p-3 font-mono text-xs text-zinc-300 overflow-auto leading-relaxed">
            {generateUnifiedGitDiff()}
          </pre>
        </div>
      )}

      {/* TAB 1: ISSUES */}
      {activeTab === 'issues' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Filter Bar */}
          <div className="px-3.5 py-2.5 border-b border-zinc-800 bg-[#0B0D13] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'focus-keyboard', label: 'Keyboard' },
                  { id: 'contrast-apca', label: 'Contrast' },
                  { id: 'semantics-aria', label: 'ARIA' },
                ] as { id: IssueCategory | 'all'; label: string }[]
              ).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    categoryFilter === cat.id
                      ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/80 shadow-sm'
                      : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {appliedPatches.length > 0 && (
              <button
                onClick={() => setActiveTab('git-diff')}
                className="px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1 shrink-0 hover:bg-zinc-700 transition-colors"
              >
                <GitCompare className="w-3 h-3" />
                <span>Patch ({appliedPatches.length})</span>
              </button>
            )}
          </div>

          {/* Issues List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {filteredIssues.length === 0 ? (
              <div className="text-center py-12 px-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-zinc-200">
                  No Violations Detected
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  All automated checks in this category meet WCAG 2.1 standards.
                </p>
              </div>
            ) : (
              filteredIssues.map((issue) => {
                const isSelected = selectedIssueId === issue.id;
                const isCodeOpen = Boolean(expandedCodeIds[issue.id]);
                const sevStyle =
                  issue.severity === 'critical'
                    ? 'bg-red-500/10 text-red-400 border-red-500/25'
                    : issue.severity === 'serious'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                    : 'bg-sky-500/10 text-sky-400 border-sky-500/25';

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
                    className={`rounded-lg border p-3.5 transition-all cursor-pointer ${
                      issue.isPatched
                        ? 'bg-emerald-950/10 border-emerald-500/25'
                        : isSelected
                        ? 'bg-[#161824] border-zinc-500 shadow-md ring-1 ring-zinc-500/30'
                        : 'bg-[#12141D] border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {/* Header: Severity & Standard */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${sevStyle}`}
                        >
                          {issue.severity}
                        </span>

                        <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                          {issue.wcagCriteria}
                        </span>

                        <span className="text-[11px] font-mono text-zinc-500 truncate max-w-[140px]">
                          {issue.selector}
                        </span>
                      </div>

                      {issue.isPatched && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Patched
                        </span>
                      )}
                    </div>

                    {/* Title & Impact */}
                    <h3 className="text-xs font-semibold text-zinc-100 leading-snug">
                      {issue.title}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      {issue.impactSummary}
                    </p>

                    {/* Remediation Note */}
                    <div className="mt-2.5 p-2.5 rounded-md bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 leading-relaxed">
                      <span className="text-zinc-200 font-semibold">Remediation: </span>
                      {issue.aiExplanation}
                    </div>

                    {/* Action Row */}
                    <div
                      className="mt-3 flex items-center justify-between gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {!issue.isPatched ? (
                        <button
                          onClick={() => onApplySingleFix(issue)}
                          className="flex-1 py-1.5 px-3 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>Apply Fix</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onRevertSingleFix(issue.id)}
                          className="flex-1 py-1.5 px-3 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Revert Patch</span>
                        </button>
                      )}

                      <button
                        onClick={() => toggleCodeExpand(issue.id)}
                        className="py-1.5 px-2.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-medium flex items-center gap-1 transition-colors"
                      >
                        <span>{isCodeOpen ? 'Hide' : 'Code'}</span>
                        {isCodeOpen ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Collapsible Diff */}
                    {isCodeOpen && (
                      <div
                        className="mt-3 pt-3 border-t border-zinc-800 space-y-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded border border-zinc-800 text-[11px]">
                            <button
                              onClick={() => setCodeFormat('jsx')}
                              className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                                codeFormat === 'jsx'
                                  ? 'bg-zinc-800 text-zinc-100'
                                  : 'text-zinc-400'
                              }`}
                            >
                              JSX
                            </button>
                            <button
                              onClick={() => setCodeFormat('html')}
                              className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                                codeFormat === 'html'
                                  ? 'bg-zinc-800 text-zinc-100'
                                  : 'text-zinc-400'
                              }`}
                            >
                              HTML
                            </button>
                          </div>

                          <button
                            onClick={() => copyText(targetSnippet, issue.id)}
                            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                          >
                            {copiedId === issue.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Code</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="rounded-md bg-[#080A0F] border border-zinc-800 p-2 font-mono text-[11px] overflow-x-auto space-y-1">
                          <div className="text-red-400/90 line-through">
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

      {/* TAB 2: FOCUS ORDER */}
      {activeTab === 'focus-map' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3.5 border-b border-zinc-800 bg-[#0B0D13]">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-zinc-200">
                Sequential Tab Order ({focusStops.length} Elements)
              </h2>
              <GlossaryBadge
                termKey="tabindex"
                displayText="tabindex spec"
                className="text-xs text-zinc-400 hover:text-zinc-200 font-mono"
                align="right"
              />
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Keyboard traversal path evaluated in DOM order. Click any step to inspect.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
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
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                    isCurrent
                      ? 'bg-[#161824] border-zinc-500 shadow-md ring-1 ring-zinc-500/30'
                      : hasBug
                      ? 'bg-red-950/10 border-red-500/30 hover:border-red-500/50'
                      : 'bg-[#12141D] border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-md text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                      isCurrent
                        ? 'bg-white text-zinc-950'
                        : hasBug
                        ? 'bg-red-600/80 text-white'
                        : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {stop.index}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-zinc-200 truncate">
                        {stop.accessibleName}
                      </span>
                      <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 shrink-0">
                        &lt;{stop.tagName}&gt;
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {stop.isPositiveTabIndexAnomaly && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                          Out-of-order tabindex=&quot;{stop.rawTabIndex}&quot;
                        </span>
                      )}
                      {stop.isVisualOrderMismatch && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Visual jump upwards
                        </span>
                      )}
                      {!stop.hasFocusRing && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                          No focus ring
                        </span>
                      )}
                      {!hasBug && (
                        <span className="text-[11px] text-emerald-400">
                          Compliant focus flow
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

      {/* TAB 3: CONTRAST & VISION */}
      {activeTab === 'contrast' || activeTab === 'vision-lab' ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Vision Simulation */}
          <div className="p-3.5 rounded-lg bg-[#12141D] border border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-zinc-400" />
                <h2 className="text-xs font-semibold text-zinc-200">
                  Vision Simulation
                </h2>
              </div>
              {visionMode !== 'normal' && visionMode !== 'glaucoma' && (
                <button
                  onClick={() => setSplitVisionCurtain(!splitVisionCurtain)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                    splitVisionCurtain
                      ? 'bg-white text-zinc-950 border-white font-medium'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-700'
                  }`}
                >
                  {splitVisionCurtain ? 'Split Active' : '50/50 Split'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {VISION_MODES.map((m) => {
                const active = visionMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setVisionMode(m.id)}
                    className={`p-2 rounded-md border text-left transition-all ${
                      active
                        ? 'bg-zinc-800 border-zinc-600 text-white shadow-sm'
                        : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="text-xs font-medium truncate">{m.shortLabel}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">{m.prevalence}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contrast Audits */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-zinc-200">
                Color Contrast ({contrastReports.length} Elements)
              </h2>
              <div className="flex items-center gap-2 text-xs">
                <GlossaryBadge termKey="AA" displayText="WCAG AA" className="text-zinc-400 hover:text-zinc-200" align="right" />
                <GlossaryBadge termKey="APCA" displayText="APCA Lc" className="text-zinc-400 hover:text-zinc-200" align="right" />
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
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    passBoth
                      ? 'bg-[#12141D] border-zinc-800'
                      : 'bg-red-950/10 border-red-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-zinc-200 truncate">
                      &ldquo;{c.textPreview}&rdquo;
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                          c.passesAA
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                            : 'bg-red-500/15 text-red-400 border border-red-500/25'
                        }`}
                      >
                        {effectiveRatio}:1 {c.passesAAA ? 'AAA' : c.passesAA ? 'AA' : 'Fail'}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                          c.passesApca
                            ? 'bg-sky-500/15 text-sky-400 border border-sky-500/25'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                        }`}
                      >
                        Lc {Math.round(Math.abs(c.apcaLc))}
                      </span>
                    </div>
                  </div>

                  {/* Swatches */}
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-3 h-3 rounded-sm border border-white/20 inline-block"
                          style={{ backgroundColor: c.fgHex }}
                        />
                        {c.fgHex}
                      </span>
                      <span className="text-zinc-600">on</span>
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-3 h-3 rounded-sm border border-white/20 inline-block"
                          style={{
                            backgroundColor: c.worstGradientBgHex || c.bgHex,
                          }}
                        />
                        {c.worstGradientBgHex || c.bgHex}
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-500">{c.fontSizePx}px font</span>
                  </div>

                  {!passBoth && (
                    <div
                      className="mt-3 pt-2.5 border-t border-zinc-800 space-y-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="px-2.5 py-1.5 rounded bg-red-500/10 border border-red-500/20 text-[11px] text-red-300">
                        {c.explanation ||
                          `Contrast ratio ${effectiveRatio}:1 fails WCAG AA minimum (${c.isLargeText ? '3.0' : '4.5'}:1).`}
                      </div>

                      {/* Code Snippet */}
                      <div className="rounded-md bg-[#080A0F] border border-zinc-800 p-2 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-400 text-[10px] font-medium uppercase">
                            Suggested Fix
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const snippet = `color: ${c.fgHex};\nbackground-color: ${c.suggestedBgHex};`;
                              copyText(snippet, `code-${c.id}`);
                            }}
                            className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                          >
                            {copiedId === `code-${c.id}` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy CSS</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="font-mono text-[11px] text-zinc-400 pl-2 border-l-2 border-emerald-500/60">
                          {c.suggestedBgHex !== (c.worstGradientBgHex || c.bgHex) && (
                            <div>background-color: {c.suggestedBgHex};</div>
                          )}
                          {c.suggestedFgHex !== c.fgHex && (
                            <div>color: {c.suggestedFgHex};</div>
                          )}
                        </div>
                      </div>

                      {/* Live Hot-Patch */}
                      <div className="flex items-center gap-2 pt-1">
                        {c.suggestedBgHex !== (c.worstGradientBgHex || c.bgHex) && (
                          <button
                            onClick={() =>
                              onApplyCustomContrast(c.selector, c.fgHex, c.suggestedBgHex)
                            }
                            className="flex-1 py-1.5 px-2.5 rounded bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                          >
                            <span
                              className="w-3 h-3 rounded-sm border border-white/20 inline-block"
                              style={{ backgroundColor: c.suggestedBgHex }}
                            />
                            <span>Patch Background ({c.suggestedBgHex})</span>
                          </button>
                        )}
                        {c.suggestedFgHex !== c.fgHex && (
                          <button
                            onClick={() =>
                              onApplyCustomContrast(c.selector, c.suggestedFgHex, undefined)
                            }
                            className="flex-1 py-1.5 px-2.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-zinc-700 transition-colors"
                          >
                            <span
                              className="w-3 h-3 rounded-sm border border-white/20 inline-block"
                              style={{ backgroundColor: c.suggestedFgHex }}
                            />
                            <span>Patch Text ({c.suggestedFgHex})</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* TAB 4: SCREEN READER */}
      {activeTab === 'screen-reader' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3.5 border-b border-zinc-800 bg-[#0B0D13] flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold text-zinc-200">
                Screen Reader Speech Log
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Synthetic speech announcements triggered on focus and interaction.
              </p>
            </div>
            {announcements.length > 0 && (
              <button
                onClick={clearAnnouncements}
                className="text-xs text-zinc-400 hover:text-zinc-200 px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Spoken Log */}
          <div className="h-44 border-b border-zinc-800 overflow-y-auto p-3 space-y-2 bg-[#080A0F]">
            {announcements.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center font-mono">
                Awaiting keyboard focus or click events...
              </p>
            ) : (
              announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="p-2 rounded bg-zinc-900 border border-zinc-800 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-zinc-300">
                    <span className="font-mono text-[11px] text-zinc-100">
                      &ldquo;{ann.voiceOverOutput}&rdquo;
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {ann.timestamp}
                    </span>
                  </div>
                  {ann.warning && (
                    <div className="text-[11px] text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{ann.warning}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Accessibility Tree Elements */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            <div className="text-xs text-zinc-500 mb-1">
              Accessible DOM Elements ({a11yTree.length})
            </div>

            {a11yTree.map((node) => (
              <div
                key={node.id}
                onClick={() => onSelectDomElement(node.selector)}
                onMouseEnter={() => setHoveredSelector(node.selector)}
                onMouseLeave={() => setHoveredSelector(null)}
                className={`p-2 rounded border text-xs cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                  node.hasMissingName
                    ? 'bg-red-950/10 border-red-500/30 text-red-300'
                    : 'bg-[#12141D] border-zinc-800 hover:border-zinc-700 text-zinc-300'
                }`}
              >
                <div className="truncate flex items-center gap-2">
                  <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 text-[10px] font-mono">
                    {node.role}
                  </span>
                  <span className="truncate font-medium">
                    {node.accessibleName ? `“${node.accessibleName}”` : 'Unnamed Element'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500 shrink-0">
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
