import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  ExternalLink,
  Eye,
  Globe,
  Keyboard,
  Layers,
  Maximize2,
  MousePointer2,
  Pause,
  Play,
  RotateCcw,
  Sliders,
  Sparkles,
  Terminal,
  Volume2,
  VolumeX,
  Wand2,
  Zap
} from 'lucide-react';

interface InteractiveDemoPlayerProps {
  onLaunchStudio: (presetOrCustom?: string) => void;
}

interface DemoChapter {
  id: string;
  number: string;
  title: string;
  durationSec: number;
  badge: string;
  description: string;
}

const CHAPTERS: DemoChapter[] = [
  {
    id: 'import',
    number: '01',
    title: 'Copy Element from DevTools or Enter Localhost',
    durationSec: 10,
    badge: 'Copy & Paste DOM',
    description: 'Right-click any button or component in Chrome DevTools → "Copy outerHTML" and paste it here, or enter http://localhost:3000.',
  },
  {
    id: 'contrast',
    number: '02',
    title: 'Audit APCA Perceptual Contrast',
    durationSec: 10,
    badge: 'Contrast Engine',
    description: 'Pinpoints unreadable low-contrast text using modern APCA 3.0 perceptual lightness curves.',
  },
  {
    id: 'keyboard',
    number: '03',
    title: 'Map Tab Order & Keyboard Traps',
    durationSec: 10,
    badge: 'Focus Graph',
    description: 'Traces sequential tabindex traversal with real-time SVG paths and flags trapped modal focus.',
  },
  {
    id: 'vision',
    number: '04',
    title: 'Simulate 7 Vision Deficiencies',
    durationSec: 10,
    badge: 'Vision Simulator',
    description: 'Hardware SVG color matrices simulate Protanopia, Deuteranopia, Tritanopia, and Cataracts.',
  },
  {
    id: 'screenreader',
    number: '05',
    title: 'Virtual VoiceOver Screen Reader',
    durationSec: 10,
    badge: 'Speech Synthesis',
    description: 'Computes WAI-ARIA accessible names and synthesizes realistic VoiceOver speech announcements.',
  },
  {
    id: 'heal',
    number: '06',
    title: '1-Click Auto-Heal & Export Diffs',
    durationSec: 10,
    badge: 'Auto-Remediate',
    description: 'Patches the live DOM in real time and generates copyable production CSS and React JSX diffs.',
  },
];

const TOTAL_DURATION = CHAPTERS.reduce((sum, ch) => sum + ch.durationSec, 0); // 60 seconds

const SAMPLE_ELEMENTS = [
  {
    name: 'Faint Button (Dark SaaS)',
    html: '<button class="btn" style="background:#131B2E;color:#475569;padding:10px 18px;border-radius:10px;font-size:13px;font-weight:600;border:1px solid #1E293B;">Confirm &amp; Subscribe</button>',
    issue: 'Low Contrast: 2.2:1 (Fails WCAG AA & APCA Lc 28)',
  },
  {
    name: 'Untabbable Modal Action',
    html: '<div onclick="closeModal()" style="display:inline-block;background:#334155;color:#94A3B8;padding:8px 14px;border-radius:8px;font-size:12px;cursor:pointer;">Dismiss Modal</div>',
    issue: 'Missing Keyboard Support (div has no tabindex="0" or role="button")',
  },
  {
    name: 'Ghost Input (No Label)',
    html: '<input type="email" placeholder="Enter work email..." style="background:#0F172A;border:1px solid #334155;color:#E2E8F0;padding:10px;border-radius:8px;width:100%;font-size:13px;" />',
    issue: 'Missing Accessible Name: No <label> or aria-label associated',
  },
];

export const InteractiveDemoPlayer: React.FC<InteractiveDemoPlayerProps> = ({
  onLaunchStudio,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedDevToolsSnippet, setCopiedDevToolsSnippet] = useState<boolean>(false);

  // Interactive overrides
  const [overrideFixed, setOverrideFixed] = useState<boolean | null>(null);
  const [overrideVision, setOverrideVision] = useState<string | null>(null);
  const [keyboardStep, setKeyboardStep] = useState<number>(1);
  const [selectedSampleIndex, setSelectedSampleIndex] = useState<number>(0);
  const [customPastedHtml, setCustomPastedHtml] = useState<string>('');
  const [isPastingCustom, setIsPastingCustom] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);
  const lastAnnouncedSpeechRef = useRef<string>('');

  // Calculate chapter index based on currentTimeSec
  const getCurrentChapterIndex = (timeSec: number): number => {
    let accumulated = 0;
    for (let i = 0; i < CHAPTERS.length; i++) {
      accumulated += CHAPTERS[i].durationSec;
      if (timeSec < accumulated) return i;
    }
    return CHAPTERS.length - 1;
  };

  const activeChapterIndex = getCurrentChapterIndex(currentTimeSec);
  const activeChapter = CHAPTERS[activeChapterIndex];

  // Auto-play timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setCurrentTimeSec((prev) => {
          const next = prev + 0.25;
          if (next >= TOTAL_DURATION) {
            return 0; // loop
          }
          return next;
        });
      }, 250);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  // Audio Speech Synthesis for Screen Reader Chapter
  useEffect(() => {
    if (activeChapter.id === 'screenreader' && !isAudioMuted) {
      const speechText = 'Button, Confirm Subscription. Press Control Option Space to choose.';
      if ('speechSynthesis' in window && lastAnnouncedSpeechRef.current !== speechText) {
        lastAnnouncedSpeechRef.current = speechText;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } else {
      lastAnnouncedSpeechRef.current = '';
    }
  }, [activeChapter.id, isAudioMuted]);

  // Handle seeking to a specific chapter
  const handleSeekChapter = (chapterIndex: number) => {
    let targetTime = 0;
    for (let i = 0; i < chapterIndex; i++) {
      targetTime += CHAPTERS[i].durationSec;
    }
    setCurrentTimeSec(targetTime + 0.1);
    setOverrideFixed(null);
    setOverrideVision(null);
  };

  // Jump to specific time via scrubber click
  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    setCurrentTimeSec(ratio * TOTAL_DURATION);
    setOverrideFixed(null);
    setOverrideVision(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isFixed =
    overrideFixed !== null
      ? overrideFixed
      : activeChapterIndex === 5; // Auto-fixed in chapter 6

  const currentVisionFilter =
    overrideVision !== null
      ? overrideVision
      : activeChapterIndex === 3
      ? 'deuteranopia'
      : 'none';

  const simulatedScore = isFixed
    ? 100
    : activeChapterIndex === 0
    ? 60
    : activeChapterIndex === 1
    ? 64
    : activeChapterIndex === 2
    ? 72
    : 78;

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSelectSample = (idx: number) => {
    setSelectedSampleIndex(idx);
    setIsPastingCustom(false);
    setOverrideFixed(false);
    // If user interacts, pause so they can inspect
    setIsPlaying(false);
  };

  const handlePasteCustom = () => {
    if (navigator.clipboard) {
      navigator.clipboard.readText().then((text) => {
        if (text) {
          setCustomPastedHtml(text);
          setIsPastingCustom(true);
          setOverrideFixed(false);
          setIsPlaying(false);
        }
      });
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl border border-slate-800 bg-[#0B0F17] shadow-2xl overflow-hidden flex flex-col transition-all">
      {/* Video / Player Window Header */}
      <div className="px-5 py-3.5 bg-[#0E141F] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-200">
              Interactive Product Tour
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 text-[10px] font-mono border border-teal-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
              LIVE SIMULATION
            </span>
          </div>
        </div>

        {/* Video Mode & Audio Controls */}
        <div className="flex items-center gap-2">
          {/* Audio VoiceOver Toggle Button */}
          <button
            onClick={() => {
              if (isAudioMuted && 'speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance('VoiceOver audio enabled.');
                window.speechSynthesis.speak(utterance);
              }
              setIsAudioMuted(!isAudioMuted);
            }}
            title={isAudioMuted ? 'Turn On VoiceOver Speech Audio' : 'Mute Speech Audio'}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
              !isAudioMuted
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-[#141C2A] text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            {!isAudioMuted ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">VoiceOver Audio: ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">VoiceOver Audio: OFF</span>
              </>
            )}
          </button>

          {/* Jump to Real Sandbox CTA */}
          <button
            onClick={() => onLaunchStudio()}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-600/20 flex items-center gap-1.5 transition-all"
          >
            <span>Launch Real Studio</span>
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Simulation Viewport (Simulated Live Web App + Diagnostic Overlays) */}
      <div className="p-6 md:p-8 bg-[#080C12] grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[400px]">
        {/* Left Viewport: Shows Either DevTools Copying Action or Live Sandboxed Component */}
        <div className="lg:col-span-7 flex flex-col justify-center relative">
          {/* Subheader */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {activeChapter.id === 'import' ? 'How to Import from Chrome DevTools' : 'Target Component DOM'}
            </span>
            <span className="text-[11px] font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
              {activeChapter.badge}
            </span>
          </div>

          {/* CHAPTER 1 SPECIAL VIEW: DevTools Copy-Paste Flow Demonstration */}
          {activeChapter.id === 'import' ? (
            <div className="rounded-2xl border border-slate-800 bg-[#0A0E17] p-4 relative overflow-hidden">
              {/* Simulated DevTools Bar */}
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800 text-[11px] text-slate-400 font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-teal-400 font-semibold">Chrome DevTools</span>
                  <span>•</span>
                  <span>Elements</span>
                  <span>•</span>
                  <span>Console</span>
                </div>
                <span className="text-slate-500">http://localhost:3000</span>
              </div>

              {/* DevTools Tree Simulation */}
              <div className="font-mono text-xs text-slate-300 space-y-1 bg-[#06090F] p-3 rounded-xl border border-slate-800/80 mb-3">
                <div className="text-slate-500">&lt;div class="checkout-modal"&gt;</div>
                <div className="pl-4 text-slate-500">&lt;h3&gt;Subscription Plan&lt;/h3&gt;</div>
                <div className="pl-4 py-1 px-2 rounded bg-teal-500/20 border border-teal-500/40 text-teal-200 flex items-center justify-between">
                  <span>&lt;button class="btn-dark" style="color: #475569"&gt;Confirm&lt;/button&gt;</span>
                  <span className="text-[10px] bg-teal-500 text-slate-950 px-1.5 py-0.5 rounded font-bold">
                    Right Click → Copy element
                  </span>
                </div>
                <div className="text-slate-500">&lt;/div&gt;</div>
              </div>

              {/* Arrow and Paste into AccessiVision */}
              <div className="p-3 rounded-xl bg-teal-950/30 border border-teal-500/30 text-xs">
                <div className="flex items-center gap-2 text-teal-300 font-semibold mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  <span>Pasted into AccessiVision Studio:</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                  AccessiVision automatically parses the element's DOM and inline styles, tests APCA contrast against the dark background, and generates instant fixes!
                </p>

                {/* Interactive Preset Buttons so visitors can test pasting right away */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-medium">Try Pasting Sample:</span>
                  {SAMPLE_ELEMENTS.map((sample, idx) => (
                    <button
                      key={sample.name}
                      onClick={() => handleSelectSample(idx)}
                      className={`px-2 py-1 rounded text-[11px] font-mono transition-all ${
                        selectedSampleIndex === idx && !isPastingCustom
                          ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
                          : 'bg-[#111823] text-teal-300 border border-slate-700 hover:border-teal-500'
                      }`}
                    >
                      {sample.name}
                    </button>
                  ))}
                  <button
                    onClick={handlePasteCustom}
                    className="px-2 py-1 rounded text-[11px] font-mono bg-[#162232] text-slate-200 hover:text-white border border-teal-500/40 hover:bg-teal-600 transition-colors flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3 text-teal-400" />
                    <span>Paste My Clipboard</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Chapters 2 to 6: Live Sandboxed Target Component View */
            <div
              className={`p-6 rounded-2xl border transition-all duration-500 relative overflow-hidden ${
                currentVisionFilter === 'cataracts'
                  ? 'filter blur-[1.5px] brightness-90 contrast-75'
                  : currentVisionFilter === 'protanopia'
                  ? 'filter sepia-[0.35] hue-rotate-[170deg]'
                  : currentVisionFilter === 'deuteranopia'
                  ? 'filter sepia-[0.4] hue-rotate-[140deg]'
                  : ''
              } ${
                isFixed
                  ? 'bg-[#0B1522] border-emerald-500/50 shadow-xl shadow-emerald-500/10'
                  : 'bg-[#0E141F] border-slate-800'
              }`}
            >
              {/* Visual Focus Traps / Sequential Indicators for Chapter 3 */}
              {activeChapter.id === 'keyboard' && (
                <>
                  {/* SVG Connected Path Line */}
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none z-10"
                    style={{ overflow: 'visible' }}
                  >
                    <path
                      d="M 45 45 C 100 45, 140 120, 180 120"
                      fill="none"
                      stroke="#14B8A6"
                      strokeWidth="2.5"
                      strokeDasharray="4 4"
                      className="animate-pulse"
                    />
                    <path
                      d="M 180 120 C 220 120, 260 210, 310 210"
                      fill="none"
                      stroke="#F43F5E"
                      strokeWidth="2.5"
                      strokeDasharray="4 4"
                    />
                  </svg>

                  {/* Numbered Sequential Badges */}
                  <div
                    onClick={() => setKeyboardStep(1)}
                    className={`absolute top-4 left-4 w-7 h-7 rounded-full font-mono font-bold text-xs flex items-center justify-center cursor-pointer transition-all z-20 ${
                      keyboardStep === 1
                        ? 'bg-teal-400 text-slate-950 ring-4 ring-teal-500/30 scale-110'
                        : 'bg-teal-600/60 text-white'
                    }`}
                  >
                    1
                  </div>

                  <div
                    onClick={() => setKeyboardStep(2)}
                    className={`absolute top-24 left-10 w-7 h-7 rounded-full font-mono font-bold text-xs flex items-center justify-center cursor-pointer transition-all z-20 ${
                      keyboardStep === 2
                        ? 'bg-teal-400 text-slate-950 ring-4 ring-teal-500/30 scale-110'
                        : 'bg-teal-600/60 text-white'
                    }`}
                  >
                    2
                  </div>

                  <div
                    onClick={() => setKeyboardStep(3)}
                    className={`absolute bottom-5 right-6 w-8 h-8 rounded-full font-mono font-bold text-xs flex items-center justify-center cursor-pointer transition-all z-20 ${
                      keyboardStep === 3
                        ? 'bg-rose-500 text-white ring-4 ring-rose-500/40 scale-110 animate-bounce'
                        : 'bg-rose-600/80 text-white'
                    }`}
                    title="Trap Detected: Infinite loop back to modal close"
                  >
                    3!
                  </div>
                </>
              )}

              {/* Component Header */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100 text-sm">
                    {isPastingCustom ? 'Custom Pasted Component' : SAMPLE_ELEMENTS[selectedSampleIndex].name}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-300">
                    Live DOM
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-300">$29.00 / mo</span>
              </div>

              {/* Target Description Text (Contrast Issue) */}
              <div className="relative mb-5">
                <p
                  className={`text-sm leading-relaxed transition-colors duration-500 ${
                    isFixed
                      ? 'text-teal-200 font-medium'
                      : 'text-[#475569]' // Real WCAG failure (low contrast 2.2:1)
                  }`}
                >
                  {isFixed
                    ? '✓ Auto-remediated with accessible perceptual contrast. APCA Lc 78 exceeds WCAG 2.1 AAA minimum threshold.'
                    : 'Faint unreadable gray text on dark card background. APCA score is Lc 28 (Fails WCAG 2.1 AA 4.5:1 requirement).'}
                </p>

                {/* Live Overlay diagnostic badge pointing to text */}
                {!isFixed && (
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300 text-[10px] font-mono font-semibold mt-2 animate-pulse">
                    <span>⚠ {SAMPLE_ELEMENTS[selectedSampleIndex].issue}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                    isFixed
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/25 ring-2 ring-teal-400/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  } ${activeChapter.id === 'screenreader' ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#080C12]' : ''}`}
                >
                  <span>Confirm &amp; Subscribe</span>
                  {isFixed && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                </button>

                <button className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors">
                  Cancel
                </button>
              </div>

              {/* Screen Reader Speech Visualization Bubble (Active during Chapter 5) */}
              {activeChapter.id === 'screenreader' && (
                <div className="mt-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-3 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="font-mono">
                      "Button, Confirm Subscription. Press Control Option Space to choose."
                    </span>
                  </div>
                  {/* Audio Soundwave Animation Bars */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    <div className="w-1 h-3 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1 h-5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    <div className="w-1 h-4 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Interactive Quick Toggles for visitors */}
          <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500">Live Health Score:</span>
              <span
                className={`font-mono font-bold px-2 py-0.5 rounded text-xs transition-all ${
                  simulatedScore >= 90
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                {simulatedScore}/100
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setOverrideFixed(overrideFixed === true ? false : true)}
                className="text-[11px] text-teal-400 hover:text-teal-300 underline font-medium cursor-pointer"
              >
                {isFixed ? '↺ Revert to broken state' : '⚡ Click to auto-heal live'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Diagnostic Inspector Panel */}
        <div className="lg:col-span-5 bg-[#0F1624] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Diagnostic Telemetry
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Chapter {activeChapter.number}
              </span>
            </div>

            <h4 className="text-sm font-bold text-white mb-1">
              {activeChapter.title}
            </h4>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              {activeChapter.description}
            </p>

            {/* Chapter 1: Copy-Paste Guide Telemetry */}
            {activeChapter.id === 'import' && (
              <div className="space-y-3 mb-4 text-xs">
                <div className="p-3 rounded-xl bg-[#080C12] border border-slate-800">
                  <div className="font-semibold text-teal-300 mb-1 flex items-center gap-1.5">
                    <MousePointer2 className="w-3.5 h-3.5" />
                    <span>How to Audit in 2 Steps:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px]">
                    <li>Open DevTools on your site (<kbd className="bg-slate-800 px-1 rounded font-mono">F12</kbd>).</li>
                    <li>Right click any element → <strong>Copy outerHTML</strong>.</li>
                    <li>Paste into AccessiVision Studio to auto-heal!</li>
                  </ol>
                </div>

                <div className="p-3 rounded-xl bg-[#080C12] border border-slate-800 font-mono text-[11px] text-slate-400">
                  <div className="text-slate-500 mb-1">// Or enter dev server:</div>
                  <div className="text-teal-400">http://localhost:3000</div>
                  <div className="text-teal-400">http://localhost:5173</div>
                </div>
              </div>
            )}

            {/* Chapter 2: Contrast Telemetry */}
            {activeChapter.id === 'contrast' && (
              <div className="space-y-3 mb-4">
                <div className="p-3 rounded-xl bg-[#0A0E17] border border-slate-800 text-xs">
                  <div className="flex items-center justify-between mb-1.5 text-slate-400">
                    <span>Algorithm:</span>
                    <span className="font-mono text-slate-300">APCA 3.0 (Perceptual)</span>
                  </div>
                  <div className="flex items-center justify-between mb-1.5 text-slate-400">
                    <span>Current Contrast:</span>
                    <span className="font-mono text-rose-400 font-bold">2.2:1 (Lc 28 - Fail)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Optimal Fix:</span>
                    <span className="font-mono text-emerald-400 font-bold">#99F6E4 (7.4:1 / Lc 78)</span>
                  </div>
                </div>

                <button
                  onClick={() => setOverrideFixed(!isFixed)}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-600/30 flex items-center justify-center gap-2 transition-all"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>{isFixed ? 'Revert Fix' : 'Auto-Heal Color in DOM'}</span>
                </button>
              </div>
            )}

            {/* Chapter 3: Keyboard Telemetry */}
            {activeChapter.id === 'keyboard' && (
              <div className="space-y-2.5 mb-4 text-xs">
                <div
                  onClick={() => setKeyboardStep(1)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                    keyboardStep === 1
                      ? 'bg-teal-500/15 border-teal-500/40 text-teal-200'
                      : 'bg-[#0A0E17] border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold">1. [Header Link]</span>
                    <span className="text-[10px] text-teal-400">tabindex="0" OK</span>
                  </div>
                </div>

                <div
                  onClick={() => setKeyboardStep(2)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                    keyboardStep === 2
                      ? 'bg-teal-500/15 border-teal-500/40 text-teal-200'
                      : 'bg-[#0A0E17] border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold">2. [Confirm Button]</span>
                    <span className="text-[10px] text-teal-400">outline: visible</span>
                  </div>
                </div>

                <div
                  onClick={() => setKeyboardStep(3)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                    keyboardStep === 3
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-200'
                      : 'bg-[#0A0E17] border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-rose-300">3. [Modal Close Button]</span>
                    <span className="text-[10px] text-rose-400 font-bold">Focus Trap Loop!</span>
                  </div>
                </div>
              </div>
            )}

            {/* Chapter 4: Vision Telemetry */}
            {activeChapter.id === 'vision' && (
              <div className="space-y-3 mb-4">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'none', label: 'Normal Vision' },
                    { id: 'deuteranopia', label: 'Deuteranopia (Green)' },
                    { id: 'protanopia', label: 'Protanopia (Red)' },
                    { id: 'cataracts', label: 'Cataracts / Blur' },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setOverrideVision(filter.id)}
                      className={`p-2 rounded-xl text-xs text-left font-medium border transition-all ${
                        currentVisionFilter === filter.id
                          ? 'bg-sky-500/20 border-sky-500/50 text-sky-200 font-semibold'
                          : 'bg-[#0A0E17] border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chapter 5: Screen Reader Telemetry */}
            {activeChapter.id === 'screenreader' && (
              <div className="space-y-3 mb-4">
                <div className="p-3 rounded-xl bg-[#080C12] border border-slate-800 font-mono text-[11px] text-slate-300">
                  <div className="text-slate-500 mb-1">// Computed ARIA Name</div>
                  <div className="text-emerald-400">role: "button"</div>
                  <div className="text-emerald-400">name: "Confirm &amp; Subscribe"</div>
                  <div className="text-amber-400">focusable: true</div>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Audio synthesis status:</span>
                  <span className={!isAudioMuted ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                    {!isAudioMuted ? 'Active Voice' : 'Muted (Click icon to unmute)'}
                  </span>
                </div>
              </div>
            )}

            {/* Chapter 6: Code Diff Telemetry */}
            {activeChapter.id === 'heal' && (
              <div className="space-y-3 mb-4">
                {/* Code Diff Display */}
                <div className="p-3 rounded-xl bg-[#080C12] border border-slate-800 font-mono text-[11px] text-slate-300 relative group">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span>// Production CSS Patch</span>
                    <button
                      onClick={() =>
                        handleCopyCode(
                          '/* AccessiVision Auto-Healed */\ncolor: #99f6e4 !important;\nbackground-color: #0b1522 !important;'
                        )
                      }
                      className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px]"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy CSS</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="text-rose-400 line-through">- color: #475569;</div>
                  <div className="text-emerald-400 font-bold">+ color: #99f6e4 !important;</div>
                  <div className="text-emerald-400 font-bold">+ background-color: #0b1522 !important;</div>
                </div>
              </div>
            )}
          </div>

          {/* Quick jump to Studio button in panel */}
          <div className="pt-3 border-t border-slate-800/80">
            <button
              onClick={() => onLaunchStudio()}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition-all"
            >
              <span>Test This in Live Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Video Player Timeline & Scrubber Bar */}
      <div className="px-6 py-4 bg-[#090D15] border-t border-slate-800 flex flex-col gap-3 select-none">
        {/* Scrubber Bar with Chapter Segments */}
        <div
          onClick={handleScrubberClick}
          className="relative h-2.5 bg-slate-800 hover:h-3.5 rounded-full cursor-pointer transition-all group overflow-hidden"
          title="Click to seek anywhere in the demo tour"
        >
          {/* Filled Progress Bar */}
          <div
            className="h-full bg-gradient-to-r from-teal-500 via-emerald-400 to-sky-400 rounded-full transition-all duration-200 relative"
            style={{ width: `${(currentTimeSec / TOTAL_DURATION) * 100}%` }}
          />

          {/* Chapter tick dividers */}
          {CHAPTERS.map((ch, idx) => {
            if (idx === 0) return null;
            const leftPct = (idx * 10 / TOTAL_DURATION) * 100;
            return (
              <div
                key={ch.id}
                className="absolute top-0 bottom-0 w-0.5 bg-[#090D15] z-10 pointer-events-none"
                style={{ left: `${leftPct}%` }}
              />
            );
          })}
        </div>

        {/* Player Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Play / Pause Toggle */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-8 h-8 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300 flex items-center justify-center transition-all active:scale-95"
              title={isPlaying ? 'Pause Auto-Play' : 'Play Auto-Tour'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            {/* Restart Tour */}
            <button
              onClick={() => {
                setCurrentTimeSec(0);
                setIsPlaying(true);
                setOverrideFixed(null);
                setOverrideVision(null);
                setIsPastingCustom(false);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
              title="Restart Demo from Beginning"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Time Indicator */}
            <div className="text-xs font-mono text-slate-400">
              <span className="text-white font-semibold">{formatTime(currentTimeSec)}</span>
              <span className="text-slate-600"> / </span>
              <span>{formatTime(TOTAL_DURATION)}</span>
            </div>
          </div>

          {/* Clickable Chapter Pills */}
          <div className="hidden lg:flex items-center gap-1.5">
            {CHAPTERS.map((ch, idx) => (
              <button
                key={ch.id}
                onClick={() => handleSeekChapter(idx)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  activeChapterIndex === idx
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <span>{ch.number}. {ch.badge}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
