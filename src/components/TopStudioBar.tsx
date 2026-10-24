import React, { useEffect, useRef, useState } from 'react';
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

  const [urlField, setUrlField] = useState(liveUrlInput || '');
  const [htmlDraft, setHtmlDraft] = useState('');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [showConsoleBridgeGuide, setShowConsoleBridgeGuide] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const activePresetRef = useRef<HTMLButtonElement>(null);

  // Keep urlField in sync when a custom URL is loaded
  useEffect(() => {
    if (targetMode === 'url' && liveUrlInput) {
      setUrlField(liveUrlInput);
    } else if (targetMode === 'preset') {
      setUrlField('');
    }
  }, [targetMode, liveUrlInput]);

  /** Copies text to clipboard with an execCommand fallback for HTTP/non-secure contexts */
  const copyToClipboard = (text: string): Promise<void> => {
    if (navigator.clipboard?.writeText) {
      return navigator.clipboard.writeText(text).catch(() => {
        // Clipboard API rejected — fall back to textarea trick
        fallbackCopy(text);
      });
    }
    fallbackCopy(text);
    return Promise.resolve();
  };

  const fallbackCopy = (text: string) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand('copy'); } catch { /* ignore */ }
    document.body.removeChild(ta);
  };

  // ⌘K / Ctrl+K opens the source modal from anywhere
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openSourceModal('url');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [openSourceModal]);

  // Auto-focus the relevant element based on opened tab
  useEffect(() => {
    if (sourceModalOpen) {
      if (sourceModalTab === 'presets') {
        setTimeout(() => activePresetRef.current?.focus(), 60);
      } else if (sourceModalTab === 'url') {
        setTimeout(() => urlInputRef.current?.focus(), 60);
      }
    }
  }, [sourceModalOpen, sourceModalTab]);

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

        {/* Center: Prominent High-Contrast URL Address Bar & Controls */}
        <div className="flex items-center gap-2 flex-1 max-w-3xl justify-center">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (urlField.trim()) {
                loadExternalUrl(urlField.trim());
              }
            }}
            className="flex items-center w-full bg-[#11141D] hover:bg-[#141824] focus-within:bg-[#141824] border border-zinc-700 hover:border-zinc-500 focus-within:border-white focus-within:ring-2 focus-within:ring-white/20 rounded-xl px-3 py-1.5 transition-all shadow-sm"
          >
            {targetMode === 'url' ? (
              <Globe className="w-4 h-4 text-sky-400 shrink-0 mr-2" />
            ) : targetMode === 'html' ? (
              <FileCode className="w-4 h-4 text-emerald-400 shrink-0 mr-2" />
            ) : (
              <Globe className="w-4 h-4 text-zinc-400 shrink-0 mr-2" />
            )}

            <input
              type="text"
              value={urlField}
              onChange={(e) => setUrlField(e.target.value)}
              placeholder="Enter URL to audit..."
              className="bg-transparent text-xs font-mono text-zinc-100 placeholder:text-zinc-500 focus:outline-none w-full min-w-0 mr-2"
            />

            {/* Active demo preset pill */}
            {targetMode === 'preset' && !urlField && (
              <button
                type="button"
                onClick={() => openSourceModal('presets')}
                title="Active demo scenario — click to switch scenarios"
                className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/80 text-zinc-300 mr-2 shrink-0 flex items-center gap-1 transition-colors"
              >
                <Layers className="w-3 h-3 text-zinc-400" />
                <span className="truncate max-w-[130px] sm:max-w-[170px]">
                  {SANDBOX_PRESETS.find((p) => p.id === activePresetId)?.name.split('—')[0].trim() || 'LuminaPay'} (Demo)
                </span>
                <ChevronDown className="w-2.5 h-2.5 text-zinc-500" />
              </button>
            )}

            {urlField && (
              <button
                type="button"
                onClick={() => setUrlField('')}
                className="text-zinc-500 hover:text-zinc-200 p-0.5 rounded transition-colors mr-1.5 shrink-0"
                title="Clear input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="submit"
              disabled={isLoadingExternalUrl || !urlField.trim()}
              className="px-3 py-1 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs shrink-0 transition-all disabled:opacity-40 disabled:hover:bg-white flex items-center gap-1.5 shadow-sm"
            >
              {isLoadingExternalUrl ? (
                <>
                  <span className="w-3 h-3 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin" />
                  <span>Auditing...</span>
                </>
              ) : (
                <span>Audit</span>
              )}
            </button>
          </form>

          {/* Demos Dropdown Button (shown when viewing custom URL or pasted HTML) */}
          {targetMode !== 'preset' && (
            <button
              type="button"
              onClick={() => openSourceModal('presets')}
              title="Browse sample accessibility demo scenarios"
              className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden lg:inline text-[11px]">Demo Scenarios</span>
              <ChevronDown className="w-3 h-3 text-zinc-500" />
            </button>
          )}

          {/* Direct Paste HTML shortcut button */}
          <button
            type="button"
            onClick={() => openSourceModal('html')}
            title="Paste raw DOM HTML snapshot (for Cloudflare / Auth-protected pages)"
            className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden xl:inline text-[11px]">Paste DOM</span>
          </button>
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
            <div className="grid grid-cols-3 gap-1 bg-[#0A0C11] p-1 rounded-lg border border-zinc-800/80 mb-4">
              <button
                onClick={() => openSourceModal('presets')}
                className={`py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  sourceModalTab === 'presets'
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Demo Scenarios</span>
              </button>
              <button
                onClick={() => openSourceModal('url')}
                className={`py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  sourceModalTab === 'url'
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-sky-400" />
                <span>Live URL</span>
              </button>
              <button
                onClick={() => openSourceModal('html')}
                className={`py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  sourceModalTab === 'html'
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Paste DOM</span>
              </button>
            </div>

            {sourceModalTab === 'presets' ? (
              <div className="space-y-3">
                <div className="text-xs text-zinc-400">
                  Select a curated WCAG test scenario with pre-configured accessibility violations:
                </div>

                <div className="space-y-2">
                  {SANDBOX_PRESETS.map((preset) => {
                    const isActive = targetMode === 'preset' && activePresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        ref={isActive || (!activePresetId && preset.id === SANDBOX_PRESETS[0].id) ? activePresetRef : undefined}
                        type="button"
                        onClick={() => {
                          setPreset(preset.id);
                          closeSourceModal();
                        }}
                        className={`w-full text-left p-3 rounded-xl border transition-all group ${
                          isActive
                            ? 'bg-zinc-800/90 border-zinc-500 shadow-md ring-1 ring-white/10'
                            : 'bg-zinc-900/60 hover:bg-zinc-800/70 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-100 group-hover:text-white">
                              {preset.name}
                            </span>
                            {isActive && (
                              <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Active
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/25">
                            {preset.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 group-hover:text-zinc-300 mb-1.5 leading-relaxed">
                          {preset.subtitle}
                        </p>
                        <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-1.5">
                          <span>Domain:</span>
                          <span className="text-zinc-400">{preset.domain}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : sourceModalTab === 'url' ? (
              <form onSubmit={handleUrlSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Website or Localhost URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      ref={urlInputRef}
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

                {/* Advanced: Login / Behind Cloudflare Help */}
                <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/80 text-xs text-zinc-400 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-zinc-300 font-medium text-[11px]">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Auditing a page behind login or Cloudflare?</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => openSourceModal('html')}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
                    >
                      Use Paste HTML tab →
                    </button>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Internal dashboards or pages with active user sessions cannot be fetched by URL alone. You can copy outerHTML from DevTools, or copy this 1-line script to stream the live page from your console:
                  </p>

                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        const snippet = `(()=>{const d=document.documentElement.cloneNode(true);d.querySelectorAll('script,.ReactQueryDevtools').forEach(s=>s.remove());let c='';for(const s of document.styleSheets){try{for(const r of s.cssRules)c+=r.cssText+'\\n'}catch{}}const st=document.createElement('style');st.textContent=c;d.querySelector('head')?.appendChild(st);const html='<base href="'+location.origin+'/">'+d.outerHTML;try{copy(html)}catch{}fetch('${window.location.origin}/api/push-dom',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:location.href,html})}).then(()=>console.log('✅ AccessiVision DOM push complete!')).catch(()=>{});})();`;
                        copyToClipboard(snippet).then(() => {
                          setCopiedSnippet(true);
                          setTimeout(() => setCopiedSnippet(false), 4000);
                        });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                        copiedSnippet
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                      }`}
                    >
                      {copiedSnippet ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied! Now paste in your site's DevTools Console</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Copy DevTools Push Script</span>
                        </>
                      )}
                    </button>
                  </div>
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
                      if (navigator.clipboard?.readText) {
                        navigator.clipboard.readText()
                          .then((text) => { if (text) setHtmlDraft(text); })
                          .catch(() => {
                            // Browser blocked clipboard-read — guide user to paste manually
                            const ta = document.querySelector<HTMLTextAreaElement>('textarea[placeholder]');
                            ta?.focus();
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
