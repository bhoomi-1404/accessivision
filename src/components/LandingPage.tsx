import React, { useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Code2,
  Copy,
  ExternalLink,
  Eye,
  Globe,
  Keyboard,
  Layers,
  MousePointer2,
  Palette,
  Play,
  RotateCcw,
  ScanEye,
  ShieldCheck,
  Sparkles,
  Star,
  Terminal,
  Volume2,
  Wrench,
  Zap,
} from 'lucide-react';
import { InteractiveDemoPlayer } from './InteractiveDemoPlayer';

interface LandingPageProps {
  onLaunchStudio: (presetOrCustom?: string) => void;
}

type HeroTab = 'keyboard' | 'vision' | 'contrast' | 'screen-reader';

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchStudio }) => {
  const [activeHeroTab, setActiveHeroTab] = useState<HeroTab>('keyboard');
  const [copiedConsole, setCopiedConsole] = useState(false);

  const handleCopyConsole = () => {
    navigator.clipboard.writeText(`copy(document.documentElement.outerHTML);`);
    setCopiedConsole(true);
    setTimeout(() => setCopiedConsole(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 flex flex-col font-sans selection:bg-zinc-950 selection:text-white">
      {/* Subtle Ambient Background Gradient */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[500px] bg-gradient-to-b from-indigo-100/50 via-sky-50/40 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Modern Sticky Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-zinc-200/80 px-6 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo and Brand */}
          <div
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-8 h-8 rounded-lg bg-[#090A0F] border border-zinc-800 flex items-center justify-center text-zinc-100 shadow-sm group-hover:scale-105 transition-transform">
              <ScanEye className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-zinc-950">
                AccessiVision
              </span>
              <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
                Studio
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-zinc-600">
            <a href="#overview" className="hover:text-zinc-950 transition-colors">
              Overview
            </a>
            <a href="#how-it-works" className="hover:text-zinc-950 transition-colors">
              How It Works
            </a>
            <a href="#preview" className="hover:text-zinc-950 transition-colors">
              Interactive Tour
            </a>
            <a href="#capabilities" className="hover:text-zinc-950 transition-colors">
              Capabilities
            </a>
            <a href="#standards" className="hover:text-zinc-950 transition-colors">
              WCAG &amp; APCA
            </a>
          </nav>

          {/* Launch Studio CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onLaunchStudio('custom')}
              className="hidden sm:inline-flex text-xs font-medium text-zinc-600 hover:text-zinc-950 px-3 py-1.5 transition-colors"
            >
              Paste DOM / URL
            </button>
            <button
              onClick={() => onLaunchStudio()}
              className="px-4 py-2 rounded-full text-xs font-semibold bg-zinc-950 hover:bg-zinc-800 text-white shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span>Launch Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION — Inspired by Twinkle.ai & Modern Minimalist UI */}
      <section id="overview" className="relative pt-16 sm:pt-20 pb-16 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Client-Side Privacy & Standards Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-zinc-200/90 text-zinc-700 text-xs font-medium mb-6 shadow-sm">
          <div className="flex items-center text-emerald-600">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <span className="font-semibold text-zinc-900">100% Client-Side Privacy</span>
          <span className="text-zinc-300">•</span>
          <span className="text-zinc-600">WCAG 2.1 &amp; APCA Perceptual Math</span>
        </div>

        {/* Two-Tone Bold Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-zinc-950 tracking-tight leading-[1.08] max-w-4xl mx-auto">
          Audit Less. Comply More.
          <span className="block text-zinc-400 font-bold mt-1">
            Fix Accessibility Live.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-zinc-600 max-w-2xl font-normal leading-relaxed mx-auto">
          AccessiVision connects with your live websites and components to help you map keyboard navigation, audit APCA contrast, simulate vision conditions, and hot-patch WCAG compliance in real time.
        </p>

        {/* Primary CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => onLaunchStudio()}
            className="px-7 py-3 rounded-full text-sm font-semibold bg-zinc-950 hover:bg-zinc-800 text-white shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
          >
            <span>Launch Free Studio</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onLaunchStudio('custom')}
            className="px-6 py-3 rounded-full text-sm font-medium bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-200 shadow-sm transition-all flex items-center gap-2"
          >
            <Terminal className="w-4 h-4 text-zinc-600" />
            <span>Connect Localhost / URL</span>
          </button>
        </div>

        {/* Segmented Feature Pill Bar (Matching Reference Design) */}
        <div className="mt-10 inline-flex items-center p-1 rounded-full bg-zinc-200/60 border border-zinc-200 backdrop-blur-sm shadow-inner gap-1">
          <button
            onClick={() => setActiveHeroTab('keyboard')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeHeroTab === 'keyboard'
                ? 'bg-white text-zinc-950 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Keyboard Flow</span>
          </button>

          <button
            onClick={() => setActiveHeroTab('vision')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeHeroTab === 'vision'
                ? 'bg-white text-zinc-950 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Vision Simulator</span>
          </button>

          <button
            onClick={() => setActiveHeroTab('contrast')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeHeroTab === 'contrast'
                ? 'bg-white text-zinc-950 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>APCA Contrast</span>
          </button>

          <button
            onClick={() => setActiveHeroTab('screen-reader')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeHeroTab === 'screen-reader'
                ? 'bg-white text-zinc-950 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Screen Reader</span>
          </button>
        </div>

        {/* HERO SHOWCASE CARD — Lush Background Canvas with Floating Interactive Modal */}
        <div className="mt-8 w-full max-w-5xl rounded-3xl border border-zinc-200/90 shadow-[0_25px_60px_rgba(0,0,0,0.08)] overflow-hidden relative min-h-[460px] sm:min-h-[520px] flex items-center justify-center p-6 sm:p-12">
          {/* Natural Lush Ambient Landscape Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-600 to-indigo-900 overflow-hidden">
            {/* Soft decorative landscape lighting hills */}
            <div className="absolute -bottom-20 -left-20 w-[600px] h-[400px] bg-emerald-400/40 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -top-20 -right-20 w-[600px] h-[400px] bg-sky-400/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-black/30" />
          </div>

          {/* Floating Glassmorphic Workspace Modal (Matches the Setup Card in Dribbble reference!) */}
          <div className="relative z-10 bg-white/95 backdrop-blur-xl border border-white/70 shadow-2xl rounded-2xl p-6 sm:p-8 max-w-md w-full text-left animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-zinc-950 flex items-center justify-center text-white text-xs">
                  <ScanEye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-900">
                    Accessibility Workspace
                  </h3>
                  <p className="text-[11px] text-zinc-500">Live DOM Diagnostic Pipeline</p>
                </div>
              </div>
              <span className="text-[11px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                Sample Audit: 88%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="py-3.5">
              <div className="flex items-center justify-between text-xs text-zinc-600 mb-1.5 font-medium">
                <span>Compliance Pipeline</span>
                <span className="font-mono text-[11px] font-semibold text-zinc-900">
                  {activeHeroTab === 'keyboard'
                    ? 'Step 1 of 4'
                    : activeHeroTab === 'vision'
                    ? 'Step 2 of 4'
                    : activeHeroTab === 'contrast'
                    ? 'Step 3 of 4'
                    : 'Step 4 of 4'}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 rounded-full transition-all duration-300"
                  style={{
                    width:
                      activeHeroTab === 'keyboard'
                        ? '30%'
                        : activeHeroTab === 'vision'
                        ? '55%'
                        : activeHeroTab === 'contrast'
                        ? '80%'
                        : '100%',
                  }}
                />
              </div>
            </div>

            {/* Dynamic Step Checklist (Changes based on active hero tab!) */}
            <div className="space-y-2.5 py-1">
              <div
                className={`p-2.5 rounded-xl border transition-all ${
                  activeHeroTab === 'keyboard'
                    ? 'bg-zinc-50 border-zinc-300 shadow-sm'
                    : 'bg-white border-zinc-100'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-zinc-900">
                      Sequential Keyboard Tab Flow
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">0 Traps</span>
                </div>
                {activeHeroTab === 'keyboard' && (
                  <p className="text-[11px] text-zinc-600 mt-1 pl-6">
                    Connectors trace every element in DOM order. Detects missing focus rings and loops.
                  </p>
                )}
              </div>

              <div
                className={`p-2.5 rounded-xl border transition-all ${
                  activeHeroTab === 'vision'
                    ? 'bg-zinc-50 border-zinc-300 shadow-sm'
                    : 'bg-white border-zinc-100'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-zinc-900">
                      7 Vision Deficiency Simulation
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">Active</span>
                </div>
                {activeHeroTab === 'vision' && (
                  <p className="text-[11px] text-zinc-600 mt-1 pl-6">
                    Simulates Deuteranopia, Protanopia, Cataracts, and Glaucoma with a 50/50 split curtain.
                  </p>
                )}
              </div>

              <div
                className={`p-2.5 rounded-xl border transition-all ${
                  activeHeroTab === 'contrast'
                    ? 'bg-zinc-50 border-zinc-300 shadow-sm'
                    : 'bg-white border-zinc-100'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-zinc-900">
                      APCA &amp; WCAG AA Contrast Audit
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">Lc 75 Passed</span>
                </div>
                {activeHeroTab === 'contrast' && (
                  <p className="text-[11px] text-zinc-600 mt-1 pl-6">
                    Computes perceptual contrast on font size and dark mode with 1-click accessible color hot-patching.
                  </p>
                )}
              </div>

              <div
                className={`p-2.5 rounded-xl border transition-all ${
                  activeHeroTab === 'screen-reader'
                    ? 'bg-zinc-50 border-zinc-300 shadow-sm'
                    : 'bg-white border-zinc-100'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-zinc-900">
                      Synthesized Screen Reader Speech
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">Ready</span>
                </div>
                {activeHeroTab === 'screen-reader' && (
                  <p className="text-[11px] text-zinc-600 mt-1 pl-6">
                    Live Web Speech API vocalizes announcements for every active focus stop and flags missing labels.
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Button Action (Matches Dribbble pill button) */}
            <div className="pt-4 mt-2">
              <button
                onClick={() => onLaunchStudio()}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-zinc-950 hover:bg-zinc-800 text-white shadow-sm flex items-center justify-center gap-2 transition-all group"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Open in Live Studio Sandbox</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* COMPATIBILITY BAR */}
        <div className="mt-14 w-full max-w-4xl border-t border-zinc-200/80 pt-8">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400 mb-6">
            Compatible with DOM Rendered by Any Frontend Stack or Framework
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 text-sm font-semibold tracking-wide text-zinc-400 grayscale opacity-75">
            <span className="hover:text-zinc-900 transition-colors">REACT</span>
            <span className="hover:text-zinc-900 transition-colors">NEXT.JS</span>
            <span className="hover:text-zinc-900 transition-colors">VUE</span>
            <span className="hover:text-zinc-900 transition-colors">TAILWIND CSS</span>
            <span className="hover:text-zinc-900 transition-colors">CHROME</span>
            <span className="hover:text-zinc-900 transition-colors">GITHUB PAGES</span>
            <span className="hover:text-zinc-900 transition-colors">WCAG 2.1</span>
          </div>
        </div>
      </section>

      {/* HOW TO AUDIT YOUR APP IN 3 SIMPLE STEPS */}
      <section id="how-it-works" className="py-20 px-6 max-w-7xl mx-auto w-full border-t border-zinc-200/80">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <MousePointer2 className="w-3.5 h-3.5" />
            Developer Workflow
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 tracking-tight">
            How to Audit Any Web Component or Localhost App
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-600 leading-relaxed">
            Zero command-line setup or complex extensions required. Two streamlined methods to audit code in seconds:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Method 1: Copy Element outerHTML */}
          <div className="p-7 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-zinc-900">
                      Method 1: Copy Any Element from DevTools
                    </h3>
                    <p className="text-xs text-zinc-500">For buttons, modals, cards, or design system components</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
                  Fastest (5s)
                </span>
              </div>

              <div className="space-y-2.5 text-xs text-zinc-600 mb-6">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <strong className="text-zinc-900">Inspect Element:</strong> Open your app, right-click any element &rarr; click <code>Inspect</code>.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <strong className="text-zinc-900">Copy outerHTML:</strong> In Elements panel, right-click highlighted HTML &rarr; select <strong>Copy &gt; Copy outerHTML</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <strong className="text-zinc-900">Paste in Studio:</strong> Hit <strong>Paste HTML / DOM</strong> in AccessiVision and audit live!
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => onLaunchStudio('custom')}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-zinc-950 hover:bg-zinc-800 text-white shadow-sm flex items-center justify-center gap-2 transition-all"
            >
              <span>Try Pasting an Element</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Method 2: Connect Localhost / Live URL */}
          <div className="p-7 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-zinc-900">
                      Method 2: Connect Localhost or Live URL
                    </h3>
                    <p className="text-xs text-zinc-500">For full web applications and multi-step navigation flows</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
                  Full Page
                </span>
              </div>

              <div className="space-y-2.5 text-xs text-zinc-600 mb-6">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <strong className="text-zinc-900">Run Local Dev Server:</strong> Start your dev server (e.g. <code>http://localhost:3000</code>).
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <strong className="text-zinc-900">Enter Address:</strong> In AccessiVision, paste the URL or localhost port in the address bar.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <strong className="text-zinc-900">Live Visual Overlays:</strong> Tab navigation arrows and APCA contrast badges immediately render over your live UI.
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => onLaunchStudio('custom')}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-zinc-950 hover:bg-zinc-800 text-white shadow-sm flex items-center justify-center gap-2 transition-all"
            >
              <span>Connect Localhost in Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Pro Tip: Authenticated Intranets & SPAs */}
        <div className="mt-8 max-w-5xl mx-auto p-4 rounded-xl bg-white border border-zinc-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-zinc-900">
                Auditing an app behind a login screen?
              </h4>
              <p className="text-xs text-zinc-500 mt-0.5">
                Run <code className="bg-zinc-100 px-1 py-0.5 rounded font-mono text-[11px] text-zinc-800">copy(document.documentElement.outerHTML)</code> in your browser DevTools console to capture the styled page with login cookies intact, then paste into AccessiVision!
              </p>
            </div>
          </div>
          <button
            onClick={handleCopyConsole}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm shrink-0 flex items-center gap-1.5 transition-colors"
          >
            {copiedConsole ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedConsole ? 'Copied Command!' : 'Copy Script'}</span>
          </button>
        </div>
      </section>

      {/* INTERACTIVE TOUR SECTION */}
      <section id="preview" className="py-16 px-6 max-w-7xl mx-auto w-full border-t border-zinc-200/80">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Guided Product Tour
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 tracking-tight">
            See How AccessiVision Auto-Remediates an Inaccessible UI in 50 Seconds
          </h2>
          <p className="mt-3 text-sm text-zinc-600 leading-relaxed">
            Watch the automated walkthrough below to test the APCA contrast engine, keyboard focus trap graph, vision filters, and VoiceOver screen reader.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl bg-[#090A0F]">
          <InteractiveDemoPlayer onLaunchStudio={onLaunchStudio} />
        </div>
      </section>

      {/* CORE CAPABILITIES GRID */}
      <section id="capabilities" className="py-20 px-6 max-w-7xl mx-auto w-full border-t border-zinc-200/80">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <Zap className="w-3.5 h-3.5" />
            Core Capabilities
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 tracking-tight">
            Built for Modern Frontend Engineers &amp; Design Systems
          </h2>
          <p className="mt-3 text-sm text-zinc-600 leading-relaxed">
            Eliminate subjective guesswork. AccessiVision gives you visual, audible, and code-level diagnostic instruments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-300 shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900 mb-4">
              <Keyboard className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 mb-1.5">
              Visual Keyboard Flow
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Maps sequential tab navigation order with live numbered badges and connecting paths. Detects missing focus outlines and keyboard traps.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-300 shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900 mb-4">
              <Palette className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 mb-1.5">
              APCA Contrast Engine
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Implements the Accessible Perceptual Contrast Algorithm (WCAG 3.0 draft) to evaluate text readability on dark and light themes.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-300 shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900 mb-4">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 mb-1.5">
              7 Vision Deficiencies
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Simulate Deuteranopia, Protanopia, Tritanopia, Achromatopsia, Cataracts, and Glaucoma with an interactive 50/50 split comparison curtain.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-300 shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900 mb-4">
              <Volume2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 mb-1.5">
              Screen Reader Speech
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Uses browser SpeechSynthesis to vocalize elements as blind users encounter them. Flags empty buttons, unlinked inputs, and missing ARIA roles.
            </p>
          </div>
        </div>
      </section>

      {/* STANDARDS & COMPLIANCE TABLE */}
      <section id="standards" className="py-20 px-6 max-w-7xl mx-auto w-full border-t border-zinc-200/80">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            Compliance Target
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 tracking-tight">
            Built for Global Accessibility Laws &amp; Standards
          </h2>
          <p className="mt-3 text-sm text-zinc-600 leading-relaxed">
            Ensure your digital products comply with international legal mandates:
          </p>
        </div>

        <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-700 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-4">Standard / Law</th>
                <th className="p-4">Jurisdiction</th>
                <th className="p-4">Requirement</th>
                <th className="p-4">AccessiVision Support</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-600">
              <tr>
                <td className="p-4 font-semibold text-zinc-900">WCAG 2.1 Level AA</td>
                <td className="p-4">Global W3C Target</td>
                <td className="p-4">4.5:1 text contrast, keyboard accessibility, accessible names</td>
                <td className="p-4 font-medium text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Automated Rules Engine
                </td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-zinc-900">ADA Title III</td>
                <td className="p-4">United States</td>
                <td className="p-4">Commercial websites accessible to people with disabilities</td>
                <td className="p-4 font-medium text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Diagnostic Verification
                </td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-zinc-900">European Accessibility Act (EAA)</td>
                <td className="p-4">European Union</td>
                <td className="p-4">Mandatory accessibility for e-commerce, banking, and digital services</td>
                <td className="p-4 font-medium text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> EN 301 549 (WCAG 2.1 AA) Rules
                </td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-zinc-900">APCA (WCAG 3.0 Draft)</td>
                <td className="p-4">Next-Gen Spec</td>
                <td className="p-4">Perceptual Lightness Contrast accounting for spatial frequency &amp; weight</td>
                <td className="p-4 font-medium text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Full APCA 0.98G Formula Built In
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-zinc-200/80 bg-white px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-900">AccessiVision</span>
            <span>• Real-Time Web Accessibility &amp; UX Diagnostic Studio</span>
          </div>
          <div>
            100% Client-Side Privacy • No Telemetry • Open Source Ready
          </div>
        </div>
      </footer>
    </div>
  );
};
