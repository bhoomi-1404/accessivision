# AccessiVision — Real-Time Web Accessibility & UX Diagnostic Studio

> **Senior-Grade Frontend Engineering Showcase**  
> Built with **React 18, TypeScript, Vite, Tailwind CSS, Zustand, SVG `<feColorMatrix>` Photoreceptor Pipelines, and WCAG 3.0 Draft APCA Contrast Math**.

---

## 1. Why AccessiVision Exists (The Problem Statement)

Most engineering teams rely on static, automated crawlers (`axe-core`, Lighthouse) that only catch **~30% of real-world accessibility and UX bugs**. Static AST or single-pass DOM linters fail to detect:
1. **Sequential Keyboard Focus Hijacking & Traps**: Positive `tabindex` loops, visual vs. DOM focus order jumps, suppressed `:focus-visible` outlines, and leaky modal dialogs.
2. **Dynamic CSS Gradient & Alpha-Composited Contrast**: Text rendered over `linear-gradient(...)` or translucent glassmorphic surfaces where one side passes contrast (`8:1`) while another stop drops to `1.8:1`.
3. **Color-Only UX States Under Vision Deficiencies**: Red/green inventory badges or cluster health indicators that collapse into identical luminance under **Deuteranopia**, **Protanopia**, or **Nuclear Cataracts**.
4. **Screen Reader Virtual Buffer Context Loss**: Unlabeled icon buttons, fragile `placeholder`-only inputs, and silent asynchronous toasts missing `aria-live="polite"`.

---

## 2. Core Architecture & Senior Engineering Capabilities

### A. Focus Map & Keyboard Navigation Visualizer (`src/engine/domAuditor.ts`)
- Traverses the live sandboxed iframe DOM (`contentDocument`), filtering for visible sequential focus candidates and sorting according to the HTML sequential focus navigation specification (`tabindex > 0` ascending, followed by `tabindex === 0` in DOM tree order).
- Computes Euclidean spatial jump vectors ($\Delta\text{px}$) and flags **reverse visual jumps** ($\Delta y < -95\text{px}$) and **positive `tabindex` hijacks**.
- Renders an interactive **SVG Quadratic Bezier Vector Overlay** synchronized with the live iframe, paired with a **Virtual Keyboard Stepper (`Tab ⇥`, `⇧ Tab`, `Auto-Trace`, `Enter`)**.

### B. Dual WCAG 2.1 + WCAG 3.0 (APCA) & Multi-Stop Gradient Contrast Engine (`src/engine/contrastEngine.ts`)
- Walks the ancestor chain to alpha-composite `rgba()` layers (`compositeRgba`) and parses multi-stop `linear-gradient` / `radial-gradient` declarations (`extractGradientColorStops`).
- Evaluates **worst-case gradient stop contrast** alongside both:
  - **WCAG 2.1 Relative Luminance Ratio** ($1:1 \to 21:1$)
  - **WCAG 3.0 Draft APCA (`Lc`)** polarity-sensitive perceptual lightness contrast ($-108 \to +106$)
- Automatically computes nearest accessible foreground/background hex tokens and hot-patches them into the live DOM.

### C. SVG `<feColorMatrix>` & Optical Vision Deficiency Pipeline (`src/engine/visionConfigs.ts`)
- Implements **Machado, Oliveira, and Fernandes (2009)** photoreceptor transformation matrices for **Deuteranopia, Protanopia, Tritanopia, and Achromatopsia**, plus multi-stage `<feGaussianBlur>` + `<feComponentTransfer>` pipelines for **Nuclear Cataracts**, **20/100 Low Visual Acuity**, and cursor-tracked **Glaucoma (Peripheral Tunnel Vision)**.
- Includes an interactive **50/50 Split-Screen Curtain** for real-time side-by-side comparison.

### D. AI Remediation + Live DOM Hot-Patching & Unified Git Diff Exporter
- Every flagged violation includes a one-click **"Apply Fix Live in DOM"** action that mutates the live preview DOM in real time, stores an undo snapshot (`snapshotAttributes`, `snapshotInlineStyle`), recalculates the Accessibility Health Score immediately, and generates an exportable **Unified Git Patch (`.patch`)** in both **React JSX** and **HTML**.

### E. Screen Reader Virtual Buffer (macOS VoiceOver & Windows NVDA Simulator)
- Computes the live WAI-ARIA Accessibility Tree (`role`, `accessibleName`, `aria-live`, `states`) and generates exact **VoiceOver** and **NVDA** speech strings (with optional **Web Speech API (`window.speechSynthesis`)** audio output).

---

## 3. Running Locally

```bash
npm install
npm run dev
```
