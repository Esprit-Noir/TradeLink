const fs = require('fs');

const css = fs.readFileSync('src/styles/marketing.css', 'utf8');
const lines = css.split('\n');

const startIndex = lines.findIndex(l => l.includes('/* ── Hero ──────────────────────────────────────────────── */'));
const endIndex = lines.findIndex((l, i) => i > startIndex && l.includes('/* ── Section Common ────────────────────────────────────── */'));

if (startIndex !== -1 && endIndex !== -1) {
  const newCss = `/* ── Hero Tradezella Style ──────────────────────────────────────── */
.marketing-hero-tz {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8rem 1.5rem 0rem;
  overflow: hidden;
  text-align: center;
}

.marketing-hero-tz-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 0;
}

.marketing-hero-tz-glow {
  position: absolute;
  top: -20%;
  left: 50%;
  transform: translateX(-50%);
  width: 800px;
  height: 600px;
  background: radial-gradient(circle, color-mix(in srgb, var(--color-profit) 15%, transparent) 0%, transparent 70%);
  filter: blur(80px);
  z-index: 1;
}

.marketing-hero-tz-grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  mask-image: radial-gradient(ellipse at top, black 30%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse at top, black 30%, transparent 80%);
  z-index: 0;
}

.marketing-hero-tz-container {
  position: relative;
  z-index: 2;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.marketing-hero-tz-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 800px;
  margin-bottom: 4rem;
}

.marketing-hero-tz-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 1rem;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  margin-bottom: 1.5rem;
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.1);
}

.marketing-hero-tz-badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-profit);
  box-shadow: 0 0 10px var(--color-profit);
}

.marketing-hero-tz-badge-text {
  color: var(--color-profit);
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.marketing-hero-tz-title {
  font-size: 4.5rem;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.04em;
  color: var(--color-gray-50);
  margin-bottom: 1.5rem;
  text-shadow: 0 10px 30px rgba(0,0,0,0.5);
}

.marketing-hero-tz-gradient {
  background: linear-gradient(135deg, #10b981, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.marketing-hero-tz-subtitle {
  font-size: 1.25rem;
  color: var(--color-gray-300);
  line-height: 1.6;
  margin-bottom: 2.5rem;
  max-width: 600px;
}

.marketing-hero-tz-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 3rem;
}

.marketing-hero-tz-btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem 1.8rem;
  border-radius: 12px;
  background: var(--color-profit);
  color: #000;
  font-size: 1.1rem;
  font-weight: 700;
  transition: all 0.2s;
  box-shadow: 0 0 30px rgba(34, 197, 94, 0.3);
}
.marketing-hero-tz-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 40px rgba(34, 197, 94, 0.5);
}

.marketing-hero-tz-btn-secondary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem 1.8rem;
  border-radius: 12px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  backdrop-filter: blur(10px);
  transition: all 0.2s;
}
.marketing-hero-tz-btn-secondary:hover {
  background: rgba(255,255,255,0.1);
  transform: translateY(-2px);
}

.marketing-hero-tz-social {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.marketing-hero-tz-avatars {
  display: flex;
}
.marketing-hero-tz-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid var(--color-gray-950);
  background-size: cover;
  margin-left: -10px;
}
.marketing-hero-tz-avatar:first-child {
  margin-left: 0;
}
.marketing-hero-tz-avatar-more {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid var(--color-gray-950);
  background: var(--color-gray-800);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  font-weight: 700;
  margin-left: -10px;
  z-index: 10;
}

.marketing-hero-tz-social-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
}
.marketing-hero-tz-stars {
  color: #f59e0b;
  font-size: 0.8rem;
  letter-spacing: 0.1em;
}
.marketing-hero-tz-social-text span:last-child {
  font-size: 0.75rem;
  color: var(--color-gray-400);
}

/* 3D Dashboard Mockup */
.marketing-hero-tz-visual {
  width: 100%;
  perspective: 1000px;
  margin-bottom: 4rem;
}

.marketing-hero-tz-dashboard {
  width: 100%;
  background: var(--color-gray-950);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 40px 100px -20px rgba(0,0,0,0.8), 0 0 40px rgba(34, 197, 94, 0.15);
  transform: rotateX(5deg) translateY(0);
  transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.marketing-hero-tz-dashboard:hover {
  transform: rotateX(0deg) translateY(-10px);
  box-shadow: 0 50px 120px -20px rgba(0,0,0,0.9), 0 0 60px rgba(34, 197, 94, 0.25);
}

.marketing-hero-tz-dash-header {
  height: 40px;
  background: rgba(255,255,255,0.03);
  border-bottom: 1px solid rgba(255,255,255,0.05);
  display: flex;
  align-items: center;
  padding: 0 1rem;
  position: relative;
}
.marketing-hero-tz-dash-dots {
  display: flex;
  gap: 6px;
}
.marketing-hero-tz-dash-dots span {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-gray-700);
}
.marketing-hero-tz-dash-dots span:nth-child(1) { background: #ef4444; }
.marketing-hero-tz-dash-dots span:nth-child(2) { background: #f59e0b; }
.marketing-hero-tz-dash-dots span:nth-child(3) { background: #10b981; }

.marketing-hero-tz-dash-url {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.5);
  padding: 4px 16px;
  border-radius: 6px;
  font-size: 0.75rem;
  color: var(--color-gray-400);
  font-family: monospace;
}

.marketing-hero-tz-dash-body {
  display: flex;
  height: 500px;
}

.marketing-hero-tz-dash-sidebar {
  width: 80px;
  border-right: 1px solid rgba(255,255,255,0.05);
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.marketing-hero-tz-dash-nav-item {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(255,255,255,0.05);
}
.marketing-hero-tz-dash-nav-item.active {
  background: rgba(34, 197, 94, 0.2);
  border: 1px solid rgba(34, 197, 94, 0.5);
}

.marketing-hero-tz-dash-main {
  flex: 1;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  background: radial-gradient(circle at top right, rgba(34, 197, 94, 0.05), transparent 50%);
}

.marketing-hero-tz-dash-kpis {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.marketing-hero-tz-dash-kpi {
  background: rgba(0,0,0,0.4);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}
.marketing-hero-tz-dash-kpi::before {
  content: "";
  position: absolute;
  top: 0; left: 0; width: 4px; height: 100%;
  background: var(--color-profit);
}

.marketing-hero-tz-dash-kpi .label {
  font-size: 0.85rem;
  color: var(--color-gray-400);
  margin-bottom: 0.5rem;
}
.marketing-hero-tz-dash-kpi .value {
  font-size: 2rem;
  font-weight: 800;
  color: white;
}
.marketing-hero-tz-dash-kpi .change {
  font-size: 0.8rem;
  font-weight: 600;
  margin-top: 0.5rem;
}
.marketing-hero-tz-dash-kpi .change.positive { color: var(--color-profit); }

.marketing-hero-tz-dash-chart {
  flex: 1;
  background: rgba(0,0,0,0.4);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 12px;
  padding: 1.5rem;
}

.marketing-hero-tz-trusted {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}
.marketing-hero-tz-trusted p {
  font-size: 0.85rem;
  color: var(--color-gray-400);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.marketing-hero-tz-trusted-logos {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  justify-content: center;
}
.marketing-hero-tz-trusted-logo {
  padding: 0.5rem 1rem;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 8px;
  font-weight: 700;
  color: var(--color-gray-300);
}

\n`;
  lines.splice(startIndex, endIndex - startIndex, newCss);
  fs.writeFileSync('src/styles/marketing.css', lines.join('\n'));
  console.log('Successfully replaced CSS block!');
} else {
  console.log('Could not find start or end index:', startIndex, endIndex);
}
