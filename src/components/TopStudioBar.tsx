import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  ChevronDown,
  Code2,
  Copy,
  FileCode,
  GitCompare,
  Globe,
  Layers,
  Lightbulb,
  RotateCcw,
  ScanEye,
  X,
} from 'lucide-react';
import { useStudioStore } from '../store/useStudioStore';
import { SANDBOX_PRESETS } from '../data/sandboxPresets';
import { InfoTooltip } from './InfoTooltip';

interface TopStudioBarProps {
  onApplyAllFixes: () => void;
  onResetSandbox: () => void;
  onNavigateHome?: () => void;
}

export const TopStudioBar: React.FC<TopStudioBarProps> = ({
  onApplyAllFixes,
  onResetSandbox,
  onNavigateHome,
}) => {
  const {
    activePresetId,
    targetMode,
    liveUrlInput,
    isLoadingExternalUrl,
    issues,
    score,
    initialScore,
    appliedPatches,
    sourceModalOpen,
    sourceModalTab,
    openSourceModal,
    closeSourceModal,
    setPreset,
    loadExternalUrl,
    setCustomHtml,
    setActiveTab,
  } = useStudioStore();

  const [urlField, setUrlField] = useState(liveUrlInput || 'http://localhost:3000');
  const [htmlDraft, setHtmlDraft] = useState('');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const activePreset =
    SANDBOX_PRESETS.find((p) => p.id === activePresetId) || SANDBOX_PRESETS[0];

  const unpatchedCount = issues.filter((i) => !i.isPatched).length;
  const scoreDelta =
    initialScore !== null && score > initialScore ? score - initialScore : 0;

  const scoreBadgeStyle =
    score >= 90
      ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
      : score >= 65
      ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
      : 'text-rose-400 border-rose-500/30 bg-rose-500/10';

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlField.trim()) {
      loadExternalUrl(urlField.trim());
      closeSourceModal();
    }
  };

  return (
    <>
      <header className="h-14 border-b border-zinc-800 bg-[#0E1017] px-4 flex items-center justify-between gap-4 select-none z-30">
        {/* Left: Professional Logo & Breadcrumb */}
        <div className="flex items-center gap-3">
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              title="Return to Landing Page"
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 border border-zinc-800 transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}

          <div
            onClick={onNavigateHome}
            className={`flex items-center gap-2.5 ${onNavigateHome ? 'cursor-pointer group' : ''}`}
            title={onNavigateHome ? 'Back to Landing Page' : undefined}
          >
            <div className="w-8 h-8 rounded-lg bg-[#090A0F] border border-zinc-800 flex items-center justify-center text-zinc-100 group-hover:scale-105 transition-transform shadow-sm">
              <ScanEye className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-zinc-100 group-hover:text-white transition-colors">
                AccessiVision
              </span>
              <span className="text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                Studio
              </span>
            </div>
          </div>
        </div>

        {/* Center: Unified Omnibar / Target Selector */}
        <div className="flex items-center gap-2 max-w-md w-full justify-center">
          <div className="flex items-center gap-2 bg-zinc-900/90 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg px-3 py-1.5 transition-all w-full max-w-sm">
            {targetMode === 'preset' ? (
              <Layers className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            ) : targetMode === 'url' ? (
              <Globe className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            ) : (
              <FileCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            )}

            <div className="flex-1 min-w-0">
              <select
                value={targetMode === 'preset' ? activePresetId : 'custom'}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    openSourceModal('url');
                  } else {
                    setPreset(e.target.value);
                  }
                }}
                aria-label="Select Target Application"
                className="w-full bg-transparent text-xs font-medium text-zinc-200 focus:outline-none cursor-pointer truncate pr-2"
              >
                <optgroup label="Sample Test Scenarios" className="bg-[#12141C] text-zinc-300">
                  {SANDBOX_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name} ({preset.badge})
                    </option>
                  ))}
                </optgroup>
                {targetMode !== 'preset' && (
                  <optgroup label="Active Custom Source" className="bg-[#12141C] text-zinc-200">
                    <option value="custom">
                      {targetMode === 'url' ? liveUrlInput : 'Pasted DOM / HTML'}
                    </option>
                  </optgroup>
                )}
              </select>
            </div>

            <button
              onClick={() => openSourceModal('url')}
              title="Change Source: Load URL or Paste HTML"
              className="text-[11px] font-medium text-zinc-400 hover:text-white flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded hover:bg-zinc-800 transition-colors"
            >
              <span>Change</span>
              <ChevronDown className="w-3 h-3 text-zinc-500" />
            </button>
          </div>
        </div>

        {/* Right: Real-time Compliance Score & Actions */}
        <div className="flex items-center gap-2.5">
          <InfoTooltip
            title="Accessibility Compliance Score (0–100)"
            description="Evaluated in real-time from automated WCAG 2.1 checks: keyboard traps, missing ARIA semantics, and APCA color contrast ratios."
            extraNote="Click 'Remediate All' to apply DOM patches and verify compliance."
            align="right"
          >
            <div
              className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 text-xs font-mono font-medium ${scoreBadgeStyle}`}
            >
              <span className="text-[11px] font-sans text-zinc-400">Score</span>
              <span className="font-bold">{score}</span>
              <span className="text-zinc-500">/100</span>
              {scoreDelta > 0 && (
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-1 py-0.2 rounded ml-0.5">
                  +{scoreDelta}
                </span>
              )}
            </div>
          </InfoTooltip>

          {unpatchedCount > 0 ? (
            <button
              onClick={onApplyAllFixes}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-zinc-200 active:bg-zinc-300 text-zinc-950 shadow-sm flex items-center gap-1.5 transition-all"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Remediate All ({unpatchedCount})</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('git-diff')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition-all"
            >
              <GitCompare className="w-3.5 h-3.5 text-emerald-400" />
              <span>Review Patch ({appliedPatches.length})</span>
            </button>
          )}

          {appliedPatches.length > 0 && (
            <button
              onClick={onResetSandbox}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
              title="Reset sandbox to initial state with bugs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Unified Source Modal */}
      {sourceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141D] border border-zinc-800 rounded-xl max-w-lg w-full p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">
                  Select Target to Audit
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Inspect a live URL, local dev server, or pasted DOM snapshot.
                </p>
              </div>
              <button
                onClick={closeSourceModal}
                className="text-zinc-400 hover:text-zinc-200 p-1 rounded-md hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Segmented Tabs */}
            <div className="grid grid-cols-2 gap-1 bg-[#0A0C11] p-1 rounded-lg border border-zinc-800/80 mb-4">
              <button
                onClick={() => openSourceModal('url')}
                className={`py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
                  sourceModalTab === 'url'
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-sky-400" />
                <span>Live URL / Localhost</span>
              </button>
              <button
                onClick={() => openSourceModal('html')}
                className={`py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
                  sourceModalTab === 'html'
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Paste HTML / DOM</span>
              </button>
            </div>

            {sourceModalTab === 'url' ? (
              <form onSubmit={handleUrlSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Website or Localhost URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={urlField}
                      onChange={(e) => setUrlField(e.target.value)}
                      placeholder="https://example.com or http://localhost:3000"
                      className="flex-1 rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400"
                    />
                    <button
                      type="submit"
                      disabled={isLoadingExternalUrl}
                      className="px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold shrink-0 transition-colors disabled:opacity-50"
                    >
                      {isLoadingExternalUrl ? 'Connecting...' : 'Load URL'}
                    </button>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span className="text-zinc-400 text-[11px]">Quick samples:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setUrlField('https://news.ycombinator.com');
                      loadExternalUrl('https://news.ycombinator.com');
                      closeSourceModal();
                    }}
                    className="px-2 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 font-mono text-[11px] border border-zinc-700/60 transition-colors"
                  >
                    news.ycombinator.com
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUrlField('https://example.com');
                      loadExternalUrl('https://example.com');
                      closeSourceModal();
                    }}
                    className="px-2 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 font-mono text-[11px] border border-zinc-700/60 transition-colors"
                  >
                    example.com
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUrlField('http://localhost:3000');
                      loadExternalUrl('http://localhost:3000');
                      closeSourceModal();
                    }}
                    className="px-2 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 font-mono text-[11px] border border-zinc-700/60 transition-colors"
                  >
                    localhost:3000
                  </button>
                </div>

                <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 space-y-1.5 leading-relaxed">
                  <div className="flex items-center gap-1.5 text-zinc-200 font-medium">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Auditing Authenticated or Single Page Apps:</span>
                  </div>
                  <p className="text-[11px]">
                    Pages requiring login sessions render blank when loaded by URL alone. You can copy any live element directly from your browser DevTools and paste it into the <strong>Paste HTML / DOM</strong> tab.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `(()=>{const d=document.documentElement.cloneNode(true);d.querySelectorAll('script,.ReactQueryDevtools').forEach(s=>s.remove());let c='';for(const s of document.styleSheets){try{for(const r of s.cssRules)c+=r.cssText+'\\n'}catch{}}const st=document.createElement('style');st.textContent=c;d.querySelector('head')?.appendChild(st);const html='<base href="'+location.origin+'/">'+d.outerHTML;try{copy(html)}catch{}fetch('${window.location.origin}/api/push-dom',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:location.href,html})}).then(()=>console.log('✅ AccessiVision DOM push complete!')).catch(()=>{});})();`
                      );
                      setCopiedSnippet(true);
                      setTimeout(() => setCopiedSnippet(false), 2000);
                    }}
                    className="mt-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium transition-colors"
                  >
                    {copiedSnippet
                      ? 'Copied to Clipboard! Paste in Console & Hit Enter'
                      : 'Copy Full Page Snapshot Script'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 space-y-1">
                  <div className="text-zinc-200 font-medium flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-zinc-300" />
                    <span>Capture Any Element with Styles:</span>
                  </div>
                  <p className="text-[11px]">
                    In Chrome/Safari DevTools Elements tab, right-click any element $\rightarrow$ <em>Copy</em> $\rightarrow$ <em>Copy outerHTML</em>, then paste it below.
                  </p>
                </div>

                {/* Sample Snippets */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-zinc-400 text-[11px]">Sample snippets:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setHtmlDraft(
                        '<div class="p-6 bg-zinc-900 rounded-xl text-center"><h3 class="text-white font-bold mb-2">Checkout</h3><button style="background: #1e293b; color: #475569; padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; border: 1px solid #334155;">Confirm Payment (Fails Contrast)</button></div>'
                      )
                    }
                    className="px-2 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-[11px] font-mono border border-zinc-700/60 transition-colors"
                  >
                    Low Contrast Button
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setHtmlDraft(
                        '<div class="p-6 bg-zinc-900 rounded-xl"><div onclick="alert(\'Closed\')" style="display:inline-block; background:#3b82f6; color:#fff; padding:8px 16px; border-radius:6px; cursor:pointer;">Dismiss Modal (Untabbable Div)</div></div>'
                      )
                    }
                    className="px-2 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-[11px] font-mono border border-zinc-700/60 transition-colors"
                  >
                    Untabbable Div
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setHtmlDraft(
                        '<div class="p-6 bg-zinc-900 rounded-xl space-y-3"><input type="search" placeholder="Search..." style="background:#18181b; border:1px solid #3f3f46; color:#fff; padding:10px; border-radius:8px; width:100%;" /><p style="color:#71717a; font-size:12px;">Missing accessible form label</p></div>'
                      )
                    }
                    className="px-2 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-[11px] font-mono border border-zinc-700/60 transition-colors"
                  >
                    Unlabeled Input
                  </button>
                </div>

                <div className="relative">
                  <textarea
                    value={htmlDraft}
                    onChange={(e) => setHtmlDraft(e.target.value)}
                    rows={8}
                    className="w-full rounded-lg bg-zinc-900 border border-zinc-700 p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 placeholder:text-zinc-600"
                    placeholder="Paste copied element HTML here..."
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.readText().then((text) => {
                          if (text) setHtmlDraft(text);
                        });
                      }
                    }}
                    className="absolute top-2.5 right-2.5 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-medium border border-zinc-700 transition-colors flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Paste</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-zinc-500">
                    {htmlDraft.trim() ? `${htmlDraft.length} chars ready` : 'Awaiting HTML input'}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={closeSourceModal}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!htmlDraft.trim()}
                      onClick={() => {
                        if (htmlDraft.trim()) {
                          setCustomHtml(htmlDraft);
                          closeSourceModal();
                        }
                      }}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-zinc-200 text-zinc-950 disabled:opacity-50 transition-colors shadow-sm"
                    >
                      Load into Studio
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
