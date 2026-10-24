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

## 3. How to Run Locally (Quick Start)

### Prerequisites
Make sure you have **Node.js** (v18 or higher) installed on your computer.  
*(If not installed, download it from [nodejs.org](https://nodejs.org/)).*

### Step 1: Open the Project Directory
Unzip the folder and open your terminal inside it:
```bash
cd accessivision
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start the Development Server
```bash
npm run dev
```

### Step 4: Open in Your Browser
Visit:
```
http://localhost:5173
```
* **Landing Page:** `http://localhost:5173/`
* **Direct Studio Sandbox:** `http://localhost:5173/#studio`

---

## 4. Running the Production Server Locally

You can run the full production server (including the proxy API and static file serving) with:
```bash
npm run build
npm start
```
* **Live Studio:** `http://localhost:3000/#studio`
* **Server-side Proxy API:** `http://localhost:3000/api/proxy?url=https://example.com`

---

## 5. Deployment Options

### Option A: Deploy to Vercel (Recommended — Free & 1-Click)
1. Push your project to GitHub.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"** &rarr; Import your GitHub repo.
3. Vercel automatically detects Vite + `vercel.json` + `/api/proxy.js`.
4. Click **Deploy**.
5. *(Optional)* Go to **Settings &rarr; Domains** in Vercel to attach any custom domain with free auto-renewing SSL!

### Option B: Deploy to Render / Railway / Docker
AccessiVision includes a standalone `server.js` with zero dependencies.
1. Create a **Web Service** on [render.com](https://render.com) or [railway.app](https://railway.app).
2. Set:
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
3. Your server will run with built-in CORS proxy and static app serving!

### Option C: Static Hosting (GitHub Pages) with Supabase Edge Function (Recommended for GitHub Pages)
If hosting statically on GitHub Pages and you want full URL loading without CORS:
1. Create a free project at [supabase.com](https://supabase.com).
2. Install Supabase CLI:
   ```bash
   brew install supabase/tap/supabase
   # or: npm install -g supabase
   ```
3. Link and deploy the included Edge Function:
   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   supabase functions deploy cors-proxy --no-verify-jwt
   ```
4. In AccessiVision Studio, open the **`[🌐 Load URL]`** modal &rarr; click **Configure Proxy URL** &rarr; paste `https://YOUR_PROJECT_REF.supabase.co/functions/v1/cors-proxy` &rarr; click **Save**!

### Option D: Pure Static Hosting without Backend
If hosting purely statically without configuring a server:
- Run `npm run build`
- Deploy the `dist/` directory or push your repository.
- Use the **`[📋 Paste HTML]`** button or the 1-click **Console Snippet** to audit any live website or localhost component directly without needing a backend server!

