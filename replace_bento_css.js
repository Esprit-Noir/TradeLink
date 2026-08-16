const fs = require('fs');

const css = fs.readFileSync('src/styles/marketing.css', 'utf8');
const lines = css.split('\n');

const startIndex = lines.findIndex(l => l.includes('/* ── Features ──────────────────────────────────────────── */'));
const endIndex = lines.findIndex((l, i) => i > startIndex && l.includes('/* ── How It Works ──────────────────────────────────────── */'));

if (startIndex !== -1 && endIndex !== -1) {
  const newCss = `/* ── Features (Bento Grid Tradezella) ─────────────────── */
.marketing-features {
  padding: 6rem 0;
  position: relative;
  overflow: hidden;
}

.marketing-bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(2, 300px);
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.marketing-bento-card {
  background: var(--color-gray-950);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 24px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
}
.marketing-bento-card:hover {
  transform: translateY(-5px);
  border-color: rgba(255,255,255,0.1);
  box-shadow: 0 20px 40px -10px rgba(0,0,0,0.8);
}

.marketing-bento-glow {
  position: absolute;
  top: -50px;
  right: -50px;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.3;
  z-index: 0;
  transition: opacity 0.3s;
}
.marketing-bento-card:hover .marketing-bento-glow {
  opacity: 0.5;
}
.marketing-bento-glow.green { background: #10b981; }
.marketing-bento-glow.blue { background: #3b82f6; }
.marketing-bento-glow.purple { background: #8b5cf6; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 400px; }

.marketing-bento-content {
  position: relative;
  z-index: 1;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  height: 100%;
}
.marketing-bento-content.centered {
  align-items: center;
  justify-content: center;
  text-align: center;
}
.marketing-bento-content.row {
  flex-direction: row;
  align-items: center;
  gap: 3rem;
}

.marketing-bento-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(255,255,255,0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-gray-100);
  margin-bottom: 1.5rem;
  border: 1px solid rgba(255,255,255,0.1);
}
.marketing-bento-icon.large {
  width: 64px;
  height: 64px;
  margin-bottom: 1rem;
}

.marketing-bento-content h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.75rem;
  letter-spacing: -0.02em;
}
.marketing-bento-content p {
  color: var(--color-gray-400);
  font-size: 0.95rem;
  line-height: 1.6;
}

/* Specific Grid Placements */
.marketing-bento-card.large {
  grid-column: span 2;
  grid-row: span 2;
}
.marketing-bento-card.medium {
  grid-column: span 2;
  grid-row: span 1;
}
.marketing-bento-card.small {
  grid-column: span 1;
  grid-row: span 1;
}
.marketing-bento-card.wide {
  grid-column: span 4;
  grid-row: span 1;
}

/* Visual Mockups inside Bento */
.marketing-bento-visual {
  flex: 1;
  margin-top: 2rem;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.marketing-bento-visual.bottom {
  margin-top: auto;
  padding-top: 1.5rem;
}

.bento-mockup-alert {
  background: rgba(0,0,0,0.5);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  gap: 1rem;
  width: 100%;
  align-items: flex-start;
  box-shadow: 0 10px 20px rgba(0,0,0,0.5);
}
.bento-mockup-alert .dot {
  width: 8px; height: 8px; border-radius: 50%; margin-top: 6px;
}
.bento-mockup-alert .dot.red { background: #ef4444; box-shadow: 0 0 10px #ef4444; }
.bento-mockup-alert strong { display: block; color: white; font-size: 0.9rem; margin-bottom: 4px; }
.bento-mockup-alert span { color: var(--color-gray-400); font-size: 0.8rem; }

.bento-mockup-chart {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  height: 80px;
  width: 100%;
  justify-content: center;
}
.bento-mockup-chart .bar {
  width: 32px;
  background: rgba(255,255,255,0.1);
  border-radius: 6px 6px 0 0;
  transition: height 1s ease;
}

.bento-mockup-video {
  width: 300px;
  height: 180px;
  background: rgba(0,0,0,0.5);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 20px 40px rgba(0,0,0,0.5);
}
.bento-mockup-video .play-button {
  width: 48px; height: 48px; border-radius: 50%;
  background: var(--color-brand-500);
  color: white;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 20px var(--color-brand-500);
}

@media (max-width: 1024px) {
  .marketing-bento-grid {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: auto;
  }
  .marketing-bento-card.wide { grid-column: span 2; }
  .marketing-bento-content.row { flex-direction: column; gap: 2rem; }
}
@media (max-width: 640px) {
  .marketing-bento-grid {
    grid-template-columns: 1fr;
  }
  .marketing-bento-card.large,
  .marketing-bento-card.medium,
  .marketing-bento-card.small,
  .marketing-bento-card.wide {
    grid-column: span 1;
  }
}

\n`;
  lines.splice(startIndex, endIndex - startIndex, newCss);
  fs.writeFileSync('src/styles/marketing.css', lines.join('\n'));
  console.log('Successfully replaced Bento Grid CSS block!');
} else {
  console.log('Could not find start or end index:', startIndex, endIndex);
}
