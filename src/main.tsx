import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Exact AccessiVision ScanEye Icon Geometry (matches the navbar brand squircle)
const BRAND_FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32"><rect width="32" height="32" rx="8" fill="#090A0F"/><rect x="0.5" y="0.5" width="31" height="31" rx="7.5" fill="none" stroke="#27272A" stroke-width="1"/><g transform="translate(4, 4)" fill="none" stroke="#F4F4F5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M18.944 12.33a1 1 0 0 0 0-.66 7.5 7.5 0 0 0-13.888 0 1 1 0 0 0 0 .66 7.5 7.5 0 0 0 13.888 0"/><circle cx="12" cy="12" r="1" fill="#F4F4F5" stroke="#F4F4F5"/></g></svg>`;

function ensureActiveFavicon() {
  if (typeof document === 'undefined') return;
  try {
    const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(BRAND_FAVICON_SVG)}`;

    let svgIcon = document.querySelector<HTMLLinkElement>("link[data-av-favicon='true']");
    if (!svgIcon) {
      svgIcon = document.createElement('link');
      svgIcon.setAttribute('data-av-favicon', 'true');
      svgIcon.rel = 'icon';
      svgIcon.type = 'image/svg+xml';
      document.head.appendChild(svgIcon);
    }
    svgIcon.href = dataUri;

    // Also update standard icon
    const standardIcon = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (standardIcon) {
      standardIcon.href = dataUri;
    }
  } catch {
    // Graceful fallback
  }
}

ensureActiveFavicon();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
