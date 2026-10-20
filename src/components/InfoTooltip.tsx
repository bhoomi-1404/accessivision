import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle } from 'lucide-react';

export const A11Y_GLOSSARY: Record<
  string,
  { title: string; simpleMeaning: string; whyItMatters: string }
> = {
  WCAG: {
    title: 'WCAG — Web Content Accessibility Guidelines',
    simpleMeaning:
      'The international standard for making websites usable by people with disabilities.',
    whyItMatters:
      'Most legal accessibility requirements (ADA, European Accessibility Act) are based on WCAG rules.',
  },
  AA: {
    title: 'WCAG Level AA (Industry Standard Target)',
    simpleMeaning:
      'The standard compliance level required for almost all commercial and government websites. Requires at least 4.5:1 text contrast.',
    whyItMatters:
      'Passing Level AA ensures your site works for users with moderate vision loss, color blindness, and keyboard-only navigation.',
  },
  AAA: {
    title: 'WCAG Level AAA (Highest Standard)',
    simpleMeaning:
      'The strictest accessibility level, requiring 7.0:1 text contrast for maximum readability.',
    whyItMatters:
      'Ideal for long-form reading, healthcare, banking, and older audiences.',
  },
  APCA: {
    title: 'APCA — Accessible Perceptual Contrast Algorithm (WCAG 3.0)',
    simpleMeaning:
      'A modern way to measure contrast (scored as Lc from 0 to 106) that accounts for font size, font weight, and dark mode vs. light mode.',
    whyItMatters:
      'Standard WCAG 2.1 math often misjudges dark-mode UIs. An APCA score of Lc 60+ means comfortable reading for body text.',
  },
  Lc: {
    title: 'Lc — Lightness Contrast (APCA Score)',
    simpleMeaning:
      'Perceptual contrast score from 0 to 106. Higher numbers mean clearer text. Body text needs at least Lc 60; large headings need Lc 45.',
    whyItMatters:
      'Unlike old contrast ratios, Lc accurately measures how the human eye perceives text on dark vs. light backgrounds.',
  },
  ARIA: {
    title: 'ARIA — Accessible Rich Internet Applications',
    simpleMeaning:
      'Special HTML attributes (like aria-label or role="dialog") that give extra information to screen readers without changing how the page looks.',
    whyItMatters:
      'When you use icons or custom UI widgets (like modals or tabs), ARIA tells blind users what the element is and what state it is in.',
  },
  tabindex: {
    title: 'tabindex — Keyboard Tab Order Attribute',
    simpleMeaning:
      'Controls whether an element can be focused with the Tab key and in what order.',
    whyItMatters:
      'tabindex="0" follows natural page order. Positive numbers (like tabindex="2") force the cursor to jump out of order, confusing keyboard users.',
  },
  'aria-live': {
    title: 'aria-live — Dynamic Screen Reader Alert',
    simpleMeaning:
      'Tells a screen reader to automatically speak text that appears or changes on screen (like a toast notification or error message).',
    whyItMatters:
      'Without aria-live="polite", blind users have no idea a popup toast or status message just appeared.',
  },
  VoiceOver: {
    title: 'VoiceOver & NVDA (Screen Readers)',
    simpleMeaning:
      'Software used by blind and visually impaired users that reads screen elements aloud as they navigate with a keyboard.',
    whyItMatters:
      'VoiceOver is built into macOS/iOS; NVDA is the most popular free screen reader on Windows.',
  },
  DOM: {
    title: 'DOM — Document Object Model (Live Page Structure)',
    simpleMeaning:
      'The live HTML tree of elements currently rendered in the browser.',
    whyItMatters:
      'AccessiVision inspects and patches the live DOM in real time so you can immediately see and test the fix.',
  },
};

interface InfoTooltipProps {
  label?: string;
  title: string;
  description: string;
  extraNote?: string;
  children?: React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  label,
  title,
  description,
  extraNote,
  children,
  align = 'center',
}) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [coords, setCoords] = useState<{
    top?: number;
    bottom?: number;
    left: number;
  } | null>(null);

  const calculateCoords = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 280;

    // Check vertical space: if less than 170px from window top, place below
    const placeBelow = rect.top < 170;

    // Horizontal positioning
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    if (align === 'left') {
      left = rect.left;
    } else if (align === 'right') {
      left = rect.right - tooltipWidth;
    }

    // Clamp horizontally to stay within viewport with padding
    const padding = 12;
    const maxLeft = Math.max(padding, window.innerWidth - tooltipWidth - padding);
    left = Math.max(padding, Math.min(maxLeft, left));

    if (placeBelow) {
      setCoords({
        top: Math.round(rect.bottom + 8),
        left: Math.round(left),
      });
    } else {
      setCoords({
        bottom: Math.round(window.innerHeight - rect.top + 8),
        left: Math.round(left),
      });
    }
  };

  const handleMouseEnter = () => {
    calculateCoords();
    setOpen(true);
  };

  const handleMouseLeave = () => {
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const handleUpdate = () => calculateCoords();
    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);
    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [open, align]);

  return (
    <span
      ref={triggerRef}
      className="relative inline-flex items-center gap-1 cursor-help"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children ? (
        children
      ) : (
        <span className="inline-flex items-center gap-1 underline decoration-dotted decoration-slate-500 underline-offset-2">
          {label && <span>{label}</span>}
          <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-teal-400 transition-colors shrink-0" />
        </span>
      )}

      {open &&
        coords &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="tooltip"
            style={{
              position: 'fixed',
              top: coords.top !== undefined ? `${coords.top}px` : undefined,
              bottom:
                coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
              left: `${coords.left}px`,
              width: '280px',
              zIndex: 999999,
            }}
            className="p-3.5 rounded-xl bg-[#0B1017] border border-teal-500/60 shadow-[0_16px_40px_rgba(0,0,0,0.95)] text-left pointer-events-none"
          >
            <div className="text-xs font-bold text-teal-300 mb-1 flex items-center gap-1.5">
              <span>{title}</span>
            </div>
            <p className="text-[11px] text-slate-200 leading-relaxed font-normal">
              {description}
            </p>
            {extraNote && (
              <p className="text-[10px] text-teal-200/90 mt-2 pt-1.5 border-t border-slate-800 leading-relaxed font-normal">
                💡 {extraNote}
              </p>
            )}
          </div>,
          document.body
        )}
    </span>
  );
};

interface GlossaryBadgeProps {
  termKey: keyof typeof A11Y_GLOSSARY;
  displayText?: string;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export const GlossaryBadge: React.FC<GlossaryBadgeProps> = ({
  termKey,
  displayText,
  className = '',
  align = 'center',
}) => {
  const entry = A11Y_GLOSSARY[termKey];
  if (!entry) {
    return <span className={className}>{displayText || termKey}</span>;
  }

  return (
    <InfoTooltip
      title={entry.title}
      description={entry.simpleMeaning}
      extraNote={entry.whyItMatters}
      align={align}
    >
      <span
        className={`inline-flex items-center gap-1 cursor-help border-b border-dotted border-slate-400/60 ${className}`}
      >
        <span>{displayText || termKey}</span>
        <HelpCircle className="w-3 h-3 opacity-70" />
      </span>
    </InfoTooltip>
  );
};
