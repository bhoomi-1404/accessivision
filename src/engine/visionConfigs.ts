import { VisionModeConfig } from '../types/a11y';

export const VISION_MODES: VisionModeConfig[] = [
  {
    id: 'normal',
    name: 'Standard Trichromatic Vision',
    shortLabel: 'Normal Vision',
    prevalence: 'Baseline',
    category: 'Baseline',
    description: 'Unfiltered rendering of the target DOM viewport.',
    uxImpact: 'Use as baseline to compare color-dependent status badges, charts, and links.',
  },
  {
    id: 'deuteranopia',
    name: 'Deuteranopia (Green-Blind)',
    shortLabel: 'Deuteranopia',
    prevalence: '~6% of males',
    category: 'Color Vision Deficiency',
    description:
      'Absence of green-sensitive M-cones. Red and green hues collapse into muddy olive/amber tones.',
    uxImpact:
      'Red error states and green success badges become indistinguishable without icons or text labels.',
    matrixValues:
      '0.367 0.861 -0.228 0 0  0.280 0.673 0.047 0 0  -0.012 0.043 0.969 0 0  0 0 0 1 0',
  },
  {
    id: 'protanopia',
    name: 'Protanopia (Red-Blind)',
    shortLabel: 'Protanopia',
    prevalence: '~2.5% of males',
    category: 'Color Vision Deficiency',
    description:
      'Absence of red-sensitive L-cones. Pure reds appear very dark/black and merge with dark grays.',
    uxImpact:
      'Red validation text on dark backgrounds loses luminance contrast and vanishes visually.',
    matrixValues:
      '0.152 1.053 -0.205 0 0  0.115 0.786 0.099 0 0  -0.004 -0.048 1.052 0 0  0 0 0 1 0',
  },
  {
    id: 'tritanopia',
    name: 'Tritanopia (Blue-Yellow Blind)',
    shortLabel: 'Tritanopia',
    prevalence: '~0.01% of population',
    category: 'Color Vision Deficiency',
    description:
      'Reduced S-cone sensitivity. Blues shift toward teal/green and yellows shift toward pale pink/violet.',
    uxImpact:
      'Blue hyperlinks against dark or slate surfaces and yellow warning banners lose distinction.',
    matrixValues:
      '1.256 -0.077 -0.179 0 0  -0.078 0.931 0.148 0 0  0.005 0.691 0.304 0 0  0 0 0 1 0',
  },
  {
    id: 'achromatopsia',
    name: 'Achromatopsia (Monochromacy)',
    shortLabel: 'Monochromacy',
    prevalence: 'Total Color Blindness',
    category: 'Color Vision Deficiency',
    description:
      'Complete absence of cone color perception; vision relies entirely on luminance rods.',
    uxImpact:
      'Ultimate test for luminance-only hierarchy: any UI state communicated strictly by hue fails.',
    matrixValues:
      '0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0',
  },
  {
    id: 'cataracts',
    name: 'Nuclear Cataracts (Lens Opacity & Glare)',
    shortLabel: 'Cataracts',
    prevalence: '~17% globally (40+ yrs)',
    category: 'Optical & Retinal',
    description:
      'Clouding and yellowing of the crystalline lens causing light scatter, reduced contrast, and warm cast.',
    uxImpact:
      'Low-contrast placeholder text, thin 10px–12px labels, and glassmorphic cards blur into unreadability.',
    matrixValues:
      '0.85 0.15 0.0 0 0.03  0.08 0.84 0.05 0 0.02  0.04 0.12 0.65 0 0  0 0 0 1 0',
  },
  {
    id: 'glaucoma',
    name: 'Advanced Glaucoma (Peripheral Tunnel Vision)',
    shortLabel: 'Tunnel Vision',
    prevalence: '~80M people worldwide',
    category: 'Optical & Retinal',
    description:
      'Optic nerve damage restricts peripheral visual field to a central foveal tunnel (follows cursor).',
    uxImpact:
      'Far-corner toast notifications, split action buttons, and wide form layouts become impossible to spot.',
  },
  {
    id: 'low-acuity',
    name: '20/100 Low Visual Acuity',
    shortLabel: '20/100 Acuity',
    prevalence: '~250M moderate/severe',
    category: 'Optical & Retinal',
    description:
      'Refractive blur equivalent to ~20/100 visual acuity without corrective amplification.',
    uxImpact:
      'Tests whether primary CTAs, visual hierarchy, and spacing remain scannable under spatial blur.',
  },
];
