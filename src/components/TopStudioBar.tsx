import React, { useState } from 'react';
import {
  Activity,
  ArrowLeft,
  Check,
  Code2,
  Copy,
  GitCompare,
  Globe,
  RotateCcw,
  Sparkles,
  Wand2,
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
    setPreset,
    loadExternalUrl,
    setCustomHtml,
    setActiveTab,
  } = useStudioStore();

  const [showSourceModal, setShowSourceModal] = useState(false);
  const [modalTab, setModalTab] = useState<'url' | 'html'>('url');
  const [urlField, setUrlField] = useState(liveUrlInput || 'http://localhost:3000');
  const [htmlDraft, setHtmlDraft] = useState('');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const isStaticCloudHost =
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1' &&
    window.location.hostname !== '0.0.0.0';

  const activePreset =
    SANDBOX_PRESETS.find((p) => p.id === activePresetId) || SANDBOX_PRESETS[0];

  const unpatchedCount = issues.filter((i) => !i.isPatched).length;
  const scoreDelta =
    initialScore !== null && score > initialScore ? score - initialScore : 0;

  const scoreBadgeStyle =
    score >= 90
      ? 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10'
      : score >= 65
      ? 'text-amber-300 border-amber-500/40 bg-amber-500/10'
      : 'text-rose-300 border-rose-500/40 bg-rose-500/10';

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlField.trim()) {
      loadExternalUrl(urlField.trim());
      setShowSourceModal(false);
    }
  };

  return (
    <>
      <header className="h-16 border-b border-slate-800 bg-[#0B0F17] px-5 flex items-center justify-between gap-4 select-none z-30">
        {/* Left: Clean Brand Identity (Teal/Emerald Theme) */}
        <div className="flex items-center gap-2.5">
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              title="Return to Landing Page"
              className="px-2.5 py-1.5 rounded-xl bg-[#111823] hover:bg-[#172030] text-slate-300 hover:text-white border border-slate-800 transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">Landing</span>
            </button>
          )}

          <div
            onClick={onNavigateHome}
            className={`flex items-center gap-3 ${onNavigateHome ? 'cursor-pointer group' : ''}`}
            title={onNavigateHome ? 'Back to Landing Page' : undefined}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20 border border-white/15 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white group-hover:text-teal-300 transition-colors">
                  AccessiVision
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30">
                  Live Studio
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Visual keyboard flow, contrast &amp; screen-reader inspector
              </p>
            </div>
          </div>
        </div>

        {/* Center: Simple Target Page Switcher + "Test Custom URL / Localhost" Button */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-[#111823] border border-slate-800 rounded-xl px-3 py-1.5">
            <span className="text-xs text-slate-400 font-medium">Demo App:</span>
            <select
              value={targetMode === 'preset' ? activePresetId : 'custom'}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  setShowSourceModal(true);
                } else {
                  setPreset(e.target.value);
                }
              }}
              aria-label="Select Demo Application to Audit"
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer pr-1"
            >
              {SANDBOX_PRESETS.map((preset) => (
                <option
                  key={preset.id}
                  value={preset.id}
                  className="bg-[#0F1722] text-slate-100"
                >
                  {preset.name} ({preset.badge})
                </option>
              ))}
              {targetMode !== 'preset' && (
                <option value="custom" className="bg-[#0F1722] text-teal-300">
                  Custom URL / Pasted HTML
                </option>
              )}
            </select>
          </div>

          <button
            onClick={() => {
              setHtmlDraft(activePreset.htmlContent);
              setShowSourceModal(true);
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-medium bg-[#111823] hover:bg-[#172030] border border-slate-700/80 text-slate-200 transition-colors flex items-center gap-2"
          >
            <Globe className="w-3.5 h-3.5 text-teal-400" />
            <span>Test Localhost / URL / HTML...</span>
          </button>
        </div>

        {/* Right: Clear Health Score (with Tooltip) + One-Click Fix All */}
        <div className="flex items-center gap-3">
          <InfoTooltip
            title="Accessibility Health Score (0–100)"
            description="Calculated in real time from active keyboard traps, missing screen-reader labels, and low-contrast text on the page."
            extraNote="Click 'Fix All Issues' to patch the live webpage and watch the score reach 100/100."
            align="right"
          >
            <div
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${scoreBadgeStyle}`}
            >
              <span className="text-xs text-slate-300 font-medium">Score:</span>
              <span className="text-sm font-bold font-mono">{score}/100</span>
              {scoreDelta > 0 && (
                <span className="text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                  +{scoreDelta}
                </span>
              )}
            </div>
          </InfoTooltip>

          {unpatchedCount > 0 ? (
            <button
              onClick={onApplyAllFixes}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-600/20 flex items-center gap-2 transition-all"
            >
              <Wand2 className="w-4 h-4" />
              <span>Fix All {unpatchedCount} Issues</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('git-diff')}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 flex items-center gap-2 transition-all"
            >
              <GitCompare className="w-4 h-4" />
              <span>View Code Changes ({appliedPatches.length})</span>
            </button>
          )}

          {appliedPatches.length > 0 && (
            <button
              onClick={onResetSandbox}
              className="px-2.5 py-2 rounded-xl bg-[#111823] border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-colors flex items-center gap-1 text-xs"
              title="Reset page back to original state with bugs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Reset</span>
            </button>
          )}
        </div>
      </header>

      {/* Unified Modal: Test Localhost, External URL, or Paste Custom HTML */}
      {showSourceModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F1520] border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white">
                  Test Your Own Webpage or Localhost App
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Load a live URL, connect a local dev server, or paste HTML code directly.
                </p>
              </div>
              <button
                onClick={() => setShowSourceModal(false)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Mode Switcher */}
            <div className="grid grid-cols-2 gap-2 bg-[#090D14] p-1 rounded-xl border border-slate-800 mb-4">
              <button
                onClick={() => setModalTab('url')}
                className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                  modalTab === 'url'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>1. Localhost or Live URL</span>
              </button>
              <button
                onClick={() => setModalTab('html')}
                className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                  modalTab === 'html'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>2. Paste HTML / React DOM</span>
              </button>
            </div>

            {modalTab === 'url' ? (
              <form onSubmit={handleUrlSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Enter Localhost Port or Public Website URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={urlField}
                      onChange={(e) => setUrlField(e.target.value)}
                      placeholder="http://localhost:3000 or https://example.com"
                      className="flex-1 rounded-xl bg-[#090D14] border border-slate-700 px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-teal-500"
                    />
                    <button
                      type="submit"
                      disabled={isLoadingExternalUrl}
                      className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shrink-0"
                    >
                      {isLoadingExternalUrl ? 'Loading...' : 'Load URL'}
                    </button>
                  </div>
                </div>

                {isStaticCloudHost && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 leading-relaxed flex items-start gap-2">
                    <span className="shrink-0 text-sm">💡</span>
                    <div>
                      <span className="font-semibold text-amber-100">Running on Static GitHub Pages:</span> Most external websites (like GeeksforGeeks) block third-party browser requests via CORS. For 100% reliable auditing, switch to the{' '}
                      <button
                        type="button"
                        onClick={() => setModalTab('html')}
                        className="text-teal-300 font-semibold underline hover:text-teal-200 cursor-pointer"
                      >
                        "2. Paste HTML / React DOM"
                      </button>{' '}
                      tab to paste any webpage HTML directly, or run locally (`npm run dev`) for the Headless Chrome proxy.
                    </div>
                  </div>
                )}

                {/* Quick Presets */}
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span className="text-slate-400">Quick fill &amp; Load:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setUrlField('https://example.com');
                      loadExternalUrl('https://example.com');
                      setShowSourceModal(false);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-teal-600 text-teal-300 hover:text-white font-mono text-[11px] transition-colors"
                  >
                    https://example.com
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUrlField('https://news.ycombinator.com');
                      loadExternalUrl('https://news.ycombinator.com');
                      setShowSourceModal(false);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-teal-600 text-teal-300 hover:text-white font-mono text-[11px] transition-colors"
                  >
                    https://news.ycombinator.com
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUrlField('https://localhost:8030/manage/sites');
                      loadExternalUrl('https://localhost:8030/manage/sites');
                      setShowSourceModal(false);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-teal-600 text-teal-300 hover:text-white font-mono text-[11px] transition-colors"
                  >
                    https://localhost:8030
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-1.5 leading-relaxed">
                  <div className="font-semibold text-teal-300">
                    💡 Auditing a Logged-In Local React / MFE App (like localhost:8030):
                  </div>
                  <p>
                    Logged-in Single Page Apps return an empty <code className="text-amber-300 font-mono">&lt;div id=&quot;app&quot;&gt;&lt;/div&gt;</code> when fetched by URL alone because they need your browser&apos;s login cookies. Click below to copy the <strong>Smart DOM + CSS Capture Command</strong>, run it in your app&apos;s DevTools Console, and paste it in the <strong>2. Paste HTML / React DOM</strong> tab!
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `(()=>{const d=document.documentElement.cloneNode(true);d.querySelectorAll('script,.ReactQueryDevtools').forEach(s=>s.remove());let c='';for(const s of document.styleSheets){try{for(const r of s.cssRules)c+=r.cssText+'\\n'}catch{}}const st=document.createElement('style');st.textContent=c;d.querySelector('head')?.appendChild(st);const html='<base href="'+location.origin+'/">'+d.outerHTML;try{copy(html)}catch{}fetch('http://localhost:5173/api/push-dom',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:location.href,html})}).then(()=>console.log('✅ Sent page to AccessiVision Studio!'));})();`
                      );
                      setCopiedSnippet(true);
                      setTimeout(() => setCopiedSnippet(false), 1800);
                    }}
                    className="mt-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-teal-600 text-white text-[11px] font-medium"
                  >
                    {copiedSnippet
                      ? '✓ Copied! Paste in Your App Console & Hit Enter'
                      : 'Copy Auto-Send Console Command'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3.5">
                {/* 3-Step Copy-Paste Guide */}
                <div className="p-3.5 rounded-xl bg-[#090D14] border border-teal-500/30 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-teal-300 mb-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                    <span>How to Copy an Element from Any Website or Localhost:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
                    <li>Open DevTools on your site (Right-click element &rarr; <span className="text-teal-300 font-mono">Inspect</span> or hit <kbd className="bg-slate-800 px-1 py-0.5 rounded font-mono">F12</kbd>).</li>
                    <li>In the DOM tree, right-click the element &rarr; <span className="text-teal-300 font-semibold">Copy</span> &rarr; <span className="text-teal-300 font-semibold">Copy outerHTML</span>.</li>
                    <li>Click <strong className="text-white">&quot;Paste from Clipboard&quot;</strong> below and hit <strong className="text-white">&quot;Audit Element in Studio&quot;</strong>!</li>
                  </ol>
                </div>

                {/* Quick Sample Presets */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-slate-400 text-[11px]">Or load a sample element:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setHtmlDraft(
                        '<div class="p-6 bg-slate-900 rounded-xl text-center"><h3 class="text-white font-bold mb-2">Checkout</h3><button style="background: #1e293b; color: #475569; padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; border: 1px solid #334155;">Confirm Payment (Fails Contrast)</button></div>'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 text-[11px] font-mono transition-colors"
                  >
                    Faint Button
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setHtmlDraft(
                        '<div class="p-6 bg-slate-900 rounded-xl"><div onclick="alert(\'Closed\')" style="display:inline-block; background:#3b82f6; color:#fff; padding:8px 16px; border-radius:6px; cursor:pointer;">Dismiss Modal (Untabbable Div)</div></div>'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 text-[11px] font-mono transition-colors"
                  >
                    Untabbable Div
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setHtmlDraft(
                        '<div class="p-6 bg-slate-900 rounded-xl space-y-3"><input type="search" placeholder="Search products..." style="background:#0f172a; border:1px solid #334155; color:#fff; padding:10px; border-radius:8px; width:100%;" /><p style="color:#64748b; font-size:12px;">Missing accessible label for screen readers</p></div>'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 text-[11px] font-mono transition-colors"
                  >
                    Ghost Input
                  </button>
                </div>

                <div className="relative">
                  <textarea
                    value={htmlDraft}
                    onChange={(e) => setHtmlDraft(e.target.value)}
                    rows={8}
                    className="w-full rounded-xl bg-[#090D14] border border-slate-700 p-3.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-teal-500 placeholder:text-slate-600"
                    placeholder="Paste copied element outerHTML here (e.g. <button class=&quot;...&quot;>Submit</button>)..."
                  />
                  {/* Paste from Clipboard quick button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.readText().then((text) => {
                          if (text) setHtmlDraft(text);
                        });
                      }
                    }}
                    className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-teal-600 text-slate-300 hover:text-white text-[11px] font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <Copy className="w-3 h-3 text-teal-400" />
                    <span>Paste Clipboard</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    {htmlDraft.trim() ? `${htmlDraft.length} characters ready to audit` : 'Awaiting pasted HTML'}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSourceModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 text-slate-300 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!htmlDraft.trim()}
                      onClick={() => {
                        if (htmlDraft.trim()) {
                          setCustomHtml(htmlDraft);
                          setShowSourceModal(false);
                        }
                      }}
                      className="px-5 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-teal-600/20 transition-all flex items-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Audit Element in Studio</span>
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
