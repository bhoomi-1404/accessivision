import React, { useState } from 'react';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Code2,
  Copy,
  ExternalLink,
  Eye,
  Layers,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Terminal,
  Volume2,
  Wand2,
  Zap,
  Check,
  ChevronRight,
  Sliders,
  Keyboard,
  Maximize2,
  Globe,
  MousePointer2
} from 'lucide-react';
import { InteractiveDemoPlayer } from './InteractiveDemoPlayer';

interface LandingPageProps {
  onLaunchStudio: (presetOrCustom?: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchStudio }) => {
  const [copiedDeploy, setCopiedDeploy] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDeploy(id);
    setTimeout(() => setCopiedDeploy(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#080C12] text-slate-100 flex flex-col font-sans selection:bg-teal-500/30 selection:text-teal-200">
      {/* Glow Effects Behind Hero */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-teal-500/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-40 right-10 w-96 h-96 bg-sky-500/5 blur-3xl pointer-events-none -z-10" />

      {/* Sticky Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#080C12]/80 border-b border-slate-800/80 px-6 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20 border border-white/15">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">
                  AccessiVision
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30">
                  v1.0 Studio
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Web Accessibility &amp; UX Diagnostic Suite
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300 font-medium">
            <a href="#how-to-use" className="hover:text-teal-300 transition-colors">How to Use</a>
            <a href="#preview" className="hover:text-teal-300 transition-colors">Interactive Demo</a>
            <a href="#features" className="hover:text-teal-300 transition-colors">Features</a>
            <a href="#workflow" className="hover:text-teal-300 transition-colors">Workflow</a>
            <a href="#standards" className="hover:text-teal-300 transition-colors">Standards</a>
          </nav>

          {/* Launch Studio CTA */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onLaunchStudio()}
              className="group relative px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white shadow-lg shadow-teal-500/20 border border-teal-400/30 transition-all flex items-center gap-2 active:scale-95"
            >
              <span>Launch Studio</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Release Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111823] border border-teal-500/30 text-teal-300 text-xs font-medium mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
          <span>Real-Time In-Browser Accessibility Diagnostics</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">100% Client-Side Privacy</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.15] max-w-4xl">
          Diagnose, Visualize &amp;{' '}
          <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-sky-400 bg-clip-text text-transparent">
            Auto-Heal
          </span>{' '}
          Web Accessibility in Real Time
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed">
          The visual-first accessibility workspace for developers and designers.
          Map keyboard tab paths, simulate 7 vision deficiencies, audit APCA perceptual contrast,
          and generate instant CSS &amp; JSX code fixes.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <button
            onClick={() => onLaunchStudio()}
            className="px-6 py-3.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white shadow-xl shadow-teal-500/25 border border-teal-300/30 flex items-center gap-2.5 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Zap className="w-4 h-4 fill-white text-white" />
            <span>Launch Live Studio Sandbox</span>
          </button>

          <button
            onClick={() => onLaunchStudio('custom')}
            className="px-5 py-3.5 rounded-xl text-sm font-medium bg-[#111823] hover:bg-[#172030] border border-slate-700/80 text-slate-200 hover:text-white transition-all flex items-center gap-2"
          >
            <Terminal className="w-4 h-4 text-teal-400" />
            <span>Inspect Localhost / Custom URL</span>
          </button>

          <a
            href="#preview"
            className="px-5 py-3.5 rounded-xl text-sm font-medium bg-transparent hover:bg-slate-800/40 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5"
          >
            <span>Explore Interactive Demo</span>
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>

        {/* Capability / Trust Metric Cards */}
        <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full max-w-4xl text-left">
          <div className="p-4 rounded-xl bg-[#0E141F]/80 border border-slate-800/80 backdrop-blur-sm">
            <div className="text-teal-400 text-xs font-semibold uppercase tracking-wider mb-1">
              WCAG 2.1 &amp; APCA
            </div>
            <div className="text-xl font-bold text-white">AA / AAA Ready</div>
            <p className="text-xs text-slate-400 mt-1">
              Automated scoring &amp; perceptual lightness math
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0E141F]/80 border border-slate-800/80 backdrop-blur-sm">
            <div className="text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
              Visual Overlays
            </div>
            <div className="text-xl font-bold text-white">Keyboard Flow</div>
            <p className="text-xs text-slate-400 mt-1">
              Real-time tab sequences &amp; trap detection
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0E141F]/80 border border-slate-800/80 backdrop-blur-sm">
            <div className="text-sky-400 text-xs font-semibold uppercase tracking-wider mb-1">
              Vision Simulator
            </div>
            <div className="text-xl font-bold text-white">7 Impairments</div>
            <p className="text-xs text-slate-400 mt-1">
              Protanopia, Deuteranopia, Cataracts &amp; more
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0E141F]/80 border border-slate-800/80 backdrop-blur-sm">
            <div className="text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
              Zero Telemetry
            </div>
            <div className="text-xl font-bold text-white">100% Client-Side</div>
            <p className="text-xs text-slate-400 mt-1">
              Runs in browser; private intranet &amp; localhost safe
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Product Tour & Video Walkthrough Player Section */}
      <section id="preview" className="py-16 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>Interactive Product Tour • Auto-Play Demo</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            See How AccessiVision Auto-Heals an Inaccessible UI in 50 Seconds
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Watch the automated guided tour below or scrub through the timeline to test the APCA contrast engine, keyboard focus trap graph, vision filters, and VoiceOver screen reader.
          </p>
        </div>

        <InteractiveDemoPlayer onLaunchStudio={onLaunchStudio} />
      </section>

      {/* How to Audit Your Own Code or Localhost Section */}
      <section id="how-to-use" className="py-20 px-6 max-w-7xl mx-auto border-t border-slate-800/60 w-full">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <MousePointer2 className="w-3.5 h-3.5" />
            Practical Developer Workflow
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How to Audit Any Web Component or Localhost App
          </h2>
          <p className="mt-4 text-base text-slate-400 leading-relaxed">
            You don&apos;t need complex CLI setups or browser extensions. Here are the 2 fastest ways to audit and fix your real project in seconds:
          </p>
        </div>

        {/* 2 Main Workflow Paths */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Method 1: Copy Element from Chrome DevTools */}
          <div className="p-7 rounded-2xl bg-[#0B0F17] border border-slate-800 hover:border-teal-500/40 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">Method 1: Copy Any Element from DevTools</h3>
                    <p className="text-xs text-slate-400">For buttons, modals, cards, or design system components</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30">
                  Fastest (5s)
                </span>
              </div>

              {/* Step By Step Instructions */}
              <div className="space-y-3 text-xs text-slate-300 mb-6">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#080C12] border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <strong className="text-white">Inspect Element:</strong> Open your website or web app, right-click any button or element &rarr; click <code className="text-teal-300 font-mono">Inspect</code> (or press <kbd className="bg-slate-800 px-1 py-0.5 rounded font-mono text-[10px]">F12</kbd>).
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#080C12] border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <strong className="text-white">Copy OuterHTML:</strong> In the Chrome/Firefox Elements panel, right-click the highlighted HTML tag &rarr; select <strong className="text-teal-300">Copy &gt; Copy outerHTML</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#080C12] border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <strong className="text-white">Paste into AccessiVision:</strong> Click &quot;Test Localhost / URL / HTML&quot; in the studio, paste your snippet, and click <strong className="text-teal-300">Audit Element in Studio</strong> to get instant APCA scores and auto-fixes!
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => onLaunchStudio('custom')}
              className="w-full py-3 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 transition-all"
            >
              <span>Try Pasting an Element in Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Method 2: Connect Localhost Dev Server */}
          <div className="p-7 rounded-2xl bg-[#0B0F17] border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">Method 2: Connect Localhost or Live URL</h3>
                    <p className="text-xs text-slate-400">For full web pages, multi-page apps, and user navigation flows</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Full Site Audit
                </span>
              </div>

              {/* Step By Step Instructions */}
              <div className="space-y-3 text-xs text-slate-300 mb-6">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#080C12] border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <strong className="text-white">Run Your Local Server:</strong> Start your dev server as usual (e.g. <code className="text-emerald-300 font-mono">npm run dev</code> on <code className="text-emerald-300 font-mono">http://localhost:3000</code>).
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#080C12] border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <strong className="text-white">Enter Port in Studio:</strong> In AccessiVision, click <strong className="text-emerald-300">Test Localhost / URL</strong> and enter your local address.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#080C12] border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <strong className="text-white">Interactive Sandbox Audit:</strong> The page loads inside the sandbox. Tab navigation arrows and APCA contrast badges automatically overlay over your live UI!
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => onLaunchStudio('custom')}
              className="w-full py-3 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
            >
              <span>Connect Localhost in Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Pro Tip: Authenticated Apps / Intranets */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-950/20 to-slate-900 border border-teal-500/25 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Need to audit an app behind a login screen?</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Run <code className="text-teal-300 font-mono bg-slate-800/80 px-1 py-0.5 rounded">copy(document.documentElement.outerHTML)</code> in your browser console to capture the styled DOM with login cookies intact, then paste into AccessiVision!
              </p>
            </div>
          </div>
          <button
            onClick={() => handleCopy(`copy(document.documentElement.outerHTML);`, 'console-tip')}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#111823] hover:bg-[#172030] border border-teal-500/30 text-teal-300 hover:text-white transition-all shrink-0 flex items-center gap-1.5"
          >
            {copiedDeploy === 'console-tip' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedDeploy === 'console-tip' ? 'Copied Command!' : 'Copy Console Command'}</span>
          </button>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto border-t border-slate-800/60">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <Zap className="w-3.5 h-3.5" />
            Core Capabilities
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Built for Modern Frontend Engineers &amp; Design Systems
          </h2>
          <p className="mt-4 text-base text-slate-400 leading-relaxed">
            Stop guessing if your UI is accessible. AccessiVision gives you visual, audible, and code-level diagnostic instruments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-[#0B0F17] border border-slate-800 hover:border-teal-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-5 group-hover:scale-105 transition-transform">
              <Keyboard className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-teal-300 transition-colors">
              Visual Keyboard Flow
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Maps sequential tab navigation order with live numbered badges and connecting paths. Detects missing focus outlines and keyboard traps.
            </p>
            <ul className="mt-4 space-y-1.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-teal-400" />
                <span>Tab order sequencing &amp; loop check</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-teal-400" />
                <span>Modal trap containment verification</span>
              </li>
            </ul>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-[#0B0F17] border border-slate-800 hover:border-emerald-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-105 transition-transform">
              <Sliders className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
              APCA Contrast Healer
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Audits text contrast with modern APCA 3.0 perceptual algorithms. Live-fixes colors with polarity awareness and provides copyable CSS/JSX diffs.
            </p>
            <ul className="mt-4 space-y-1.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Polarity-aware light/dark color auto-pick</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>One-click copyable CSS &amp; React JSX diff</span>
              </li>
            </ul>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-[#0B0F17] border border-slate-800 hover:border-sky-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-5 group-hover:scale-105 transition-transform">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-sky-300 transition-colors">
              7 Vision Impairments
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Simulates Protanopia, Deuteranopia, Tritanopia, Achromatopsia, Cataracts, and low contrast conditions directly over your running web page.
            </p>
            <ul className="mt-4 space-y-1.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-sky-400" />
                <span>Zero-latency SVG hardware color filters</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-sky-400" />
                <span>Split-screen side-by-side vision curtains</span>
              </li>
            </ul>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-[#0B0F17] border border-slate-800 hover:border-amber-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-105 transition-transform">
              <Volume2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
              Virtual Screen Reader
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Emulates screen reader speech output in-browser. Inspects computed accessible names, ARIA roles, and warns when buttons lack descriptive text.
            </p>
            <ul className="mt-4 space-y-1.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-amber-400" />
                <span>Real-time speech synthesis audio playback</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-amber-400" />
                <span>ARIA 1.2 accessible name tree inspector</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* How It Works (3 Steps) */}
      <section id="workflow" className="py-20 px-6 max-w-7xl mx-auto border-t border-slate-800/60">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <Layers className="w-3.5 h-3.5" />
            Seamless Workflow
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            From Audit to Production Patch in 3 Steps
          </h2>
          <p className="mt-4 text-base text-slate-400">
            Audit any micro-frontend, design system component, or full web application instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Step 1 */}
          <div className="p-6 rounded-2xl bg-[#0B0F17] border border-slate-800 relative">
            <div className="text-3xl font-mono font-bold text-teal-400/30 mb-3">01</div>
            <h3 className="text-lg font-bold text-white mb-2">Load Any URL or DOM</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Switch between pre-loaded sample applications (E-Commerce, Cloud SaaS, Auth Portal) or point the studio to your local server (<code className="text-teal-300 text-xs">http://localhost:3000</code>) or raw pasted HTML.
            </p>
            <div className="p-3 rounded-xl bg-[#080C12] border border-slate-800/80 text-xs text-slate-400 font-mono">
              &gt; iframe src="localhost:3000"
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-2xl bg-[#0B0F17] border border-slate-800 relative">
            <div className="text-3xl font-mono font-bold text-emerald-400/30 mb-3">02</div>
            <h3 className="text-lg font-bold text-white mb-2">Inspect Visual Overlays</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Hover over DOM elements to see live bounding boxes, APCA contrast ratios, and tab sequence lines. The live score updates instantly as you interact.
            </p>
            <div className="p-3 rounded-xl bg-[#080C12] border border-slate-800/80 text-xs text-slate-400 font-mono">
              &gt; Health Score: 78/100 (4 issues)
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-2xl bg-[#0B0F17] border border-slate-800 relative">
            <div className="text-3xl font-mono font-bold text-sky-400/30 mb-3">03</div>
            <h3 className="text-lg font-bold text-white mb-2">Auto-Heal &amp; Export Diffs</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Click "Fix Color Live" or "Fix All Issues" to remediate the live DOM. Review code diffs and copy the production CSS/JSX directly into your codebase.
            </p>
            <div className="p-3 rounded-xl bg-[#080C12] border border-slate-800/80 text-xs text-emerald-300 font-mono">
              &gt; Copied clean patch to clipboard!
            </div>
          </div>
        </div>
      </section>

      {/* Standards & Guidelines Matrix */}
      <section id="standards" className="py-20 px-6 max-w-7xl mx-auto border-t border-slate-800/60">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            Compliance &amp; Specs
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Backed by World-Class Standards
          </h2>
          <p className="mt-4 text-base text-slate-400">
            AccessiVision adheres strictly to current standards while preparing you for upcoming specifications.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-[#0B0F17] border border-slate-800">
            <div className="text-xs font-semibold text-teal-400 uppercase tracking-wider mb-1">
              W3C Recommendation
            </div>
            <h3 className="text-lg font-bold text-white mb-2">WCAG 2.1 AA &amp; AAA</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Verifies Guideline 1.4.3 (Contrast Minimum), 2.1.1 (Keyboard Navigable), 2.1.2 (No Keyboard Trap), and 4.1.2 (Name, Role, Value).
            </p>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20">
              Section 508 &amp; EN 301 549
            </span>
          </div>

          <div className="p-6 rounded-xl bg-[#0B0F17] border border-slate-800">
            <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
              Next-Gen WCAG 3.0
            </div>
            <h3 className="text-lg font-bold text-white mb-2">APCA 3.0 Perceptual</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Calculates lightness contrast based on modern spatial frequency, background luminance, and font weight rather than archaic flat ratios.
            </p>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Perceptual Lc Metric
            </span>
          </div>

          <div className="p-6 rounded-xl bg-[#0B0F17] border border-slate-800">
            <div className="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-1">
              W3C WAI Specification
            </div>
            <h3 className="text-lg font-bold text-white mb-2">WAI-ARIA 1.2 Specs</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Tests Accessible Name and Description Computation, ARIA roles, state mappings (<code className="text-sky-300">aria-expanded</code>, <code className="text-sky-300">aria-live</code>).
            </p>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
              Screen Reader Tree
            </span>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-800/60">
        <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-10">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-[#0B0F17] border border-slate-800">
            <h4 className="font-semibold text-white text-sm mb-1.5">
              Is this really a full web application?
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Yes! AccessiVision is a client-side Single Page Web Application (SPA) built with React 18, Vite, Tailwind CSS, and TypeScript. It compiles into standard static assets and can be hosted on any web server, CDN, or cloud platform.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#0B0F17] border border-slate-800">
            <h4 className="font-semibold text-white text-sm mb-1.5">
              Does AccessiVision transmit my DOM, URLs, or code to any server?
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              No. 100% of the diagnostics, APCA contrast calculations, SVG vision filters, and screen reader announcements execute directly inside the user's browser. It works offline and is completely safe for internal localhost and enterprise intranet projects.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#0B0F17] border border-slate-800">
            <h4 className="font-semibold text-white text-sm mb-1.5">
              How do I test my own local development project?
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              In the studio top bar, click <strong className="text-slate-200">"Test Localhost / URL / HTML"</strong>. You can enter your local dev server address (such as <code className="text-teal-300">http://localhost:3000</code>) or paste an HTML DOM snippet directly.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-20 px-6 max-w-7xl mx-auto border-t border-slate-800/60 w-full">
        <div className="relative rounded-3xl bg-gradient-to-br from-[#0F1826] to-[#0A0F1A] border border-teal-500/30 p-8 sm:p-14 text-center overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Ready to Build Web Experiences That Everyone Can Use?
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
              Open the live studio sandbox right now in your browser. No sign-up, no credit card, and zero installation required.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => onLaunchStudio()}
                className="px-7 py-3.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white shadow-xl shadow-teal-500/30 border border-teal-300/30 flex items-center gap-2.5 transition-all transform hover:-translate-y-0.5"
              >
                <Zap className="w-4 h-4 fill-white text-white" />
                <span>Launch Live Studio Sandbox</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-[#06090E] px-6 py-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-teal-600/30 border border-teal-500/40 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <span className="font-semibold text-slate-200">AccessiVision Studio</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-500">Accessible Web Diagnostics for All</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => onLaunchStudio()}
              className="text-teal-400 hover:text-teal-300 transition-colors font-medium"
            >
              Enter Sandbox Studio
            </button>
            <a
              href="#standards"
              className="hover:text-slate-200 transition-colors"
            >
              WCAG 2.1 Checklist
            </a>
            <a
              href="#how-to-use"
              className="hover:text-slate-200 transition-colors"
            >
              How to Use
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
