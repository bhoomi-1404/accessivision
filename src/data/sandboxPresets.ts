import { SandboxPreset } from '../types/a11y';

export const SANDBOX_PRESETS: SandboxPreset[] = [
  {
    id: 'ecommerce-checkout',
    name: 'LuminaPay — Express Checkout',
    subtitle: 'E-Commerce Storefront & Promo Flow',
    badge: '9 Bugs',
    domain: 'checkout.luminapay.store/express',
    description:
      'Features multi-stop gradient contrast failures, positive tabindex focus hijacking, non-semantic <div> buttons, unlinked form inputs, and red/green color-only inventory states.',
    featuredBugs: [
      'Positive tabindex="1" & "2" zig-zag focus loop',
      'Multi-stop CSS gradient text contrast drop (1.8:1)',
      'Non-semantic <div onclick> button unreachable via Tab',
      'Icon-only header buttons missing aria-label',
      'Inputs using placeholder without <label for>',
    ],
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    * { box-sizing: border-box; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
    body { margin: 0; padding: 0; background: #F8FAFC; color: #0F172A; }
    .container { max-width: 880px; margin: 0 auto; padding: 20px 24px 48px; }
    .topbar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 20px; background: #FFFFFF; border: 1px solid #E2E8F0;
      border-radius: 14px; margin-bottom: 18px; box-shadow: 0 1px 3px rgba(15,23,42,0.04);
    }
    .brand { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 18px; color: #0F172A; }
    .brand-dot { width: 28px; height: 28px; border-radius: 8px; background: linear-gradient(135deg, #0D9488, #0284C7); display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 14px; }
    .nav-actions { display: flex; align-items: center; gap: 10px; }
    .icon-btn {
      width: 38px; height: 38px; border-radius: 10px; border: 1px solid #E2E8F0;
      background: #F8FAFC; display: inline-flex; align-items: center; justify-content: center;
      cursor: pointer; color: #334155; font-size: 16px;
    }
    .icon-btn:hover { background: #F1F5F9; }
    /* Bug: dynamic gradient where right-side yellow stop causes severe contrast failure with white text */
    .gradient-banner {
      background-image: linear-gradient(90deg, #0F766E 0%, #0284C7 50%, #FDE047 100%);
      border-radius: 14px; padding: 16px 22px; margin-bottom: 20px;
      display: flex; align-items: center; justify-content: space-between;
    }
    .gradient-banner-text {
      color: #FFFFFF; font-weight: 600; font-size: 14px; margin: 0;
    }
    .gradient-cta {
      background: rgba(255,255,255,0.25); border: 1px solid rgba(255,255,255,0.5);
      color: #FFFFFF; padding: 7px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;
    }
    .grid { display: grid; grid-template-columns: 1.35fr 1fr; gap: 20px; }
    .card {
      background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px;
      padding: 22px; box-shadow: 0 1px 3px rgba(15,23,42,0.03);
    }
    .card-title { font-size: 16px; font-weight: 700; margin: 0 0 14px 0; color: #0F172A; }
    .field-group { margin-bottom: 14px; }
    .input-box {
      width: 100%; padding: 11px 14px; border-radius: 10px; border: 1px solid #CBD5E1;
      font-size: 14px; color: #0F172A; background: #FFFFFF;
    }
    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .muted-hint { color: #CBD5E1; font-size: 12px; margin-top: 6px; }
    .fake-btn {
      display: inline-flex; align-items: center; justify-content: center;
      background: #F0FDFA; color: #0F766E; font-weight: 600; font-size: 13px;
      padding: 10px 16px; border-radius: 10px; cursor: pointer; border: 1px dashed #0D9488;
      user-select: none; margin-top: 4px;
    }
    .primary-btn {
      width: 100%; padding: 13px 18px; border-radius: 11px; border: none;
      background: #0D9488; color: #FFFFFF; font-weight: 600; font-size: 14px;
      cursor: pointer; margin-top: 12px;
    }
    .no-ring-btn { outline: none; }
    .product-row {
      display: flex; align-items: center; gap: 12px; padding-bottom: 14px;
      border-bottom: 1px solid #F1F5F9; margin-bottom: 14px;
    }
    .product-thumb {
      width: 56px; height: 56px; border-radius: 10px; object-fit: cover;
      background: #E2E8F0; display: block;
    }
    .status-pills { display: flex; gap: 8px; margin-top: 6px; }
    /* Color-only status indicators (Red vs Green with identical luminance for Deuteranopia test) */
    .pill-stock-ok {
      background: #16A34A; color: #FFFFFF; font-size: 11px; font-weight: 600;
      padding: 3px 9px; border-radius: 999px;
    }
    .pill-stock-err {
      background: #DC2626; color: #FFFFFF; font-size: 11px; font-weight: 600;
      padding: 3px 9px; border-radius: 999px;
    }
    .live-toast {
      margin-top: 14px; padding: 10px 12px; border-radius: 10px;
      background: #FEF3C7; border: 1px solid #FDE68A; color: #92400E; font-size: 12px;
    }
    .modal-box {
      margin-top: 16px; padding: 14px; border-radius: 12px;
      background: #0F172A; color: #F8FAFC; border: 2px solid #0D9488;
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="topbar">
      <div class="brand">
        <span class="brand-dot">L</span>
        <span>LuminaPay Checkout</span>
      </div>
      <div class="nav-actions">
        <!-- Bug 1: Icon-only buttons missing aria-label -->
        <button class="icon-btn" data-purpose="Search catalog">🔍</button>
        <button class="icon-btn" data-purpose="Open notifications">🔔</button>
        <button class="icon-btn" data-purpose="View shopping cart">🛒</button>
      </div>
    </header>

    <!-- Bug 2: Dynamic multi-stop gradient contrast failure + positive tabindex="2" -->
    <div class="gradient-banner">
      <p class="gradient-banner-text">
        ⚡ FLASH DEAL: Save 40% on Pro Audio Studio Bundles — Ends in 04:19!
      </p>
      <button class="gradient-cta" tabindex="2">Claim Offer</button>
    </div>

    <div class="grid">
      <div class="card">
        <h2 class="card-title">1. Express Shipping &amp; Payment</h2>

        <!-- Bug 3: Inputs missing associated <label> (placeholder only) -->
        <div class="field-group">
          <input class="input-box" type="email" placeholder="Work email address..." />
          <!-- Bug 4: Very low contrast hint text (#CBD5E1 on #FFFFFF = 1.48:1) -->
          <p class="muted-hint">Order receipt and license key will be sent here automatically.</p>
        </div>

        <div class="row-2 field-group">
          <input class="input-box" type="text" placeholder="Cardholder full name..." />
          <input class="input-box" type="text" placeholder="Card number (4242 ••••)..." />
        </div>

        <!-- Bug 5: Non-semantic <div onclick> acting as button (unreachable by keyboard) -->
        <div
          class="fake-btn"
          data-fake-button="true"
          onclick="this.textContent = '✓ VIP 20% Promo Applied!'"
        >
          + Apply VIP Founder Discount Code
        </div>

        <!-- Bug 6: Focus ring suppressed (outline: none) + positive tabindex="1" hijacking first tab stop -->
        <button
          class="primary-btn no-ring-btn"
          tabindex="1"
          data-no-focus-ring="true"
        >
          Complete Instant Purchase ($249.00)
        </button>
      </div>

      <div class="card">
        <h2 class="card-title">Order Summary</h2>
        <div class="product-row">
          <!-- Bug 7: Image missing alt attribute -->
          <img
            class="product-thumb"
            data-suggested-alt="Lumina Studio Condenser Microphone in matte black"
            src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='64' height='64' rx='12' fill='%230D9488'/><circle cx='32' cy='28' r='12' fill='%2399F6E4'/><rect x='26' y='42' width='12' height='10' rx='3' fill='%23CCFBF1'/></svg>"
          />
          <div>
            <div style="font-weight: 600; font-size: 14px;">Lumina Studio Pro Mic</div>
            <div style="font-size: 12px; color: #64748B;">USB-C / XLR Dual Interface</div>
            <div class="status-pills">
              <span class="pill-stock-ok">Warehouse A</span>
              <span class="pill-stock-err">Warehouse B</span>
            </div>
          </div>
        </div>

        <!-- Bug 8: Dynamic status message missing role="status" and aria-live="polite" -->
        <div class="live-toast" data-missing-live="true">
          🔥 High demand: 4 other engineers have this item in their cart right now.
        </div>

        <!-- Bug 9: Modal overlay missing role="dialog" and aria-modal="true" -->
        <div class="modal-box" data-modal-trap-bug="true">
          <div style="font-size: 12px; font-weight: 700; color: #5EEAD4; margin-bottom: 4px;">
            3D-SECURE VERIFICATION WIDGET
          </div>
          <p style="font-size: 12px; margin: 0 0 10px 0; color: #CBD5E1;">
            Confirm one-time passcode before closing this embedded verification prompt.
          </p>
          <button
            style="background: #0D9488; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer;"
            tabindex="3"
          >
            Verify Passcode
          </button>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`,
  },
  {
    id: 'saas-dashboard',
    name: 'PulseCloud — Kubernetes Telemetry',
    subtitle: 'Dark-Mode FinTech & DevOps Console',
    badge: '7 Bugs',
    domain: 'console.pulsecloud.dev/clusters',
    description:
      'Tests dark-theme APCA contrast violations, color-blindness cluster health dots, positive tabindex jumps, and unlabeled icon actions.',
    featuredBugs: [
      'Dark-theme slate contrast failure (#475569 on #0F172A)',
      'Glassmorphic gradient banner contrast drop',
      'Unlabeled icon controls in cluster action bar',
      'Positive tabindex="4" jumping across navigation',
      'Live telemetry alert missing aria-live="polite"',
    ],
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    * { box-sizing: border-box; font-family: 'Inter', -apple-system, sans-serif; }
    body { margin: 0; padding: 0; background: #0B0F19; color: #F8FAFC; }
    .wrap { max-width: 880px; margin: 0 auto; padding: 20px 24px; }
    .header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 14px 18px; background: #111827; border: 1px solid #1E293B; border-radius: 12px;
      margin-bottom: 18px;
    }
    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 18px; }
    .kpi-card {
      background: #111827; border: 1px solid #1E293B; border-radius: 12px; padding: 16px;
    }
    /* Bug: Very low contrast muted label on dark card (#475569 on #111827 = 2.1:1) */
    .kpi-label { color: #475569; font-size: 12px; font-weight: 600; text-transform: uppercase; margin: 0 0 6px 0; }
    .kpi-val { font-size: 24px; font-weight: 700; color: #F8FAFC; margin: 0; }
    .gradient-alert {
      background-image: linear-gradient(90deg, #0F766E 0%, #7DD3FC 100%);
      padding: 14px 18px; border-radius: 12px; margin-bottom: 18px;
      display: flex; justify-content: space-between; align-items: center;
    }
    .gradient-alert span { color: #F8FAFC; font-size: 13px; font-weight: 600; }
    .table-card { background: #111827; border: 1px solid #1E293B; border-radius: 12px; padding: 18px; }
    .cluster-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 0; border-bottom: 1px solid #1E293B;
    }
    .btn-icon {
      background: #1E293B; border: 1px solid #334155; color: #E2E8F0;
      width: 34px; height: 34px; border-radius: 8px; cursor: pointer;
    }
    .fake-chip {
      display: inline-block; padding: 6px 12px; border-radius: 8px;
      background: #1E293B; color: #38BDF8; font-size: 12px; font-weight: 600; cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <div style="font-weight: 700; font-size: 16px;">⚡ PulseCloud Telemetry</div>
      <div style="display: flex; gap: 8px;">
        <input
          style="background:#0B0F19;border:1px solid #334155;color:#fff;padding:7px 12px;border-radius:8px;font-size:13px;"
          placeholder="Filter pods by namespace..."
        />
        <button class="btn-icon" data-purpose="Refresh cluster metrics">↻</button>
        <button class="btn-icon" data-purpose="Export audit log">⬇</button>
      </div>
    </div>

    <div class="gradient-alert" data-missing-live="true">
      <span>⚠️ Region us-east-1 experiencing elevated p99 latency (412ms)</span>
      <button
        style="background:#0F172A;color:#fff;border:none;padding:6px 12px;border-radius:6px;font-size:12px;cursor:pointer;"
        tabindex="4"
      >
        Reroute Traffic
      </button>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <p class="kpi-label">Active Nodes</p>
        <p class="kpi-val">128 / 128</p>
      </div>
      <div class="kpi-card">
        <p class="kpi-label">Memory Pressure</p>
        <p class="kpi-val">64.2%</p>
      </div>
      <div class="kpi-card">
        <p class="kpi-label">Error Budget Burn</p>
        <p class="kpi-val">0.04%</p>
      </div>
    </div>

    <div class="table-card">
      <div class="cluster-row">
        <div>
          <strong style="font-size:14px;">prod-payments-k8s-01</strong>
          <div style="font-size:12px;color:#475569;">v1.30.2 • 42 replicas healthy</div>
        </div>
        <div style="display:flex;gap:10px;align-items:center;">
          <div class="fake-chip" data-fake-button="true">Drain Node</div>
          <button
            class="btn-icon"
            data-no-focus-ring="true"
            style="outline:none;"
            data-purpose="Restart deployment"
          >
            ⚡
          </button>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`,
  },
  {
    id: 'auth-modal',
    name: 'VaultAuth — Zero-Trust MFA Portal',
    subtitle: 'Identity Verification & Focus Trap Lab',
    badge: '6 Bugs',
    domain: 'id.vaultauth.io/mfa-challenge',
    description:
      'Focuses on modal dialog focus traps, QR code alt text omissions, OTP input labeling, and reverse tab order traps.',
    featuredBugs: [
      'Modal container missing role="dialog" & aria-modal="true"',
      'QR codeauthenticator image missing alt text',
      'OTP input fields missing programmatic labels',
      'Positive tabindex="5" on recovery link',
      'Suppressed focus indicator on primary Verify button',
    ],
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    * { box-sizing: border-box; font-family: 'Inter', -apple-system, sans-serif; }
    body { margin: 0; padding: 32px; background: #0F172A; color: #F8FAFC; display: flex; justify-content: center; }
    .auth-dialog {
      width: 100%; max-width: 460px; background: #1E293B; border: 1px solid #334155;
      border-radius: 18px; padding: 26px; box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    }
    .qr-box {
      display: flex; align-items: center; gap: 16px; background: #0F172A;
      padding: 14px; border-radius: 12px; margin: 16px 0;
    }
    .otp-input {
      width: 100%; padding: 12px 14px; font-size: 16px; letter-spacing: 4px;
      border-radius: 10px; border: 1px solid #475569; background: #0F172A; color: #F8FAFC;
      margin-bottom: 14px;
    }
    .verify-btn {
      width: 100%; padding: 12px; border-radius: 10px; border: none;
      background: #0D9488; color: white; font-weight: 600; font-size: 14px; cursor: pointer;
      outline: none;
    }
  </style>
</head>
<body>
  <div class="auth-dialog" data-modal-trap-bug="true">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <h1 style="font-size:18px;margin:0;">Multi-Factor Security Challenge</h1>
      <button
        style="background:transparent;border:1px solid #475569;color:#CBD5E1;width:32px;height:32px;border-radius:8px;cursor:pointer;"
        data-purpose="Close MFA verification dialog"
      >
        ✕
      </button>
    </div>
    <p style="font-size:13px;color:#64748B;margin:8px 0 0 0;">
      Scan the authenticator key below and enter your 6-digit hardware token.
    </p>

    <div class="qr-box">
      <img
        width="64"
        height="64"
        data-suggested-alt="TOTP Authenticator QR Code for account bhoomika@company.dev"
        src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='64' height='64' rx='8' fill='white'/><rect x='8' y='8' width='18' height='18' fill='black'/><rect x='38' y='8' width='18' height='18' fill='black'/><rect x='8' y='38' width='18' height='18' fill='black'/><rect x='34' y='34' width='22' height='22' fill='%230D9488'/></svg>"
      />
      <div style="font-size:12px;color:#94A3B8;">
        Secret Key: <code style="color:#E2E8F0;">JBSW Y3DP EHPK 3PXP</code>
      </div>
    </div>

    <input class="otp-input" type="text" placeholder="000 - 000" />

    <button class="verify-btn" data-no-focus-ring="true" tabindex="5">
      Verify Hardware Token
    </button>

    <div
      style="margin-top:14px;text-align:center;font-size:13px;color:#2DD4BF;cursor:pointer;"
      data-fake-button="true"
    >
      Lost hardware key? Request emergency backup code
    </div>
  </div>
</body>
</html>`,
  },
];
