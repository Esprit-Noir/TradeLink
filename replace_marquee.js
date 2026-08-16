const fs = require('fs');
const css = fs.readFileSync('src/styles/marketing.css', 'utf8');
const lines = css.split('\n');

const startIndex = lines.findIndex(l => l.includes('/* ── Integrations ──────────────────────────────────────── */'));
const endIndex = lines.findIndex((l, i) => i > startIndex && l.includes('/* ── Testimonials ──────────────────────────────────────── */'));

if (startIndex !== -1 && endIndex !== -1) {
  const newCss = `/* ── Integrations (Marquee Tradezella) ─────────────────── */
.marketing-integrations {
  padding: 8rem 0;
  position: relative;
  background: var(--color-gray-950);
  overflow: hidden;
}

.marketing-marquee-wrapper {
  margin-top: 4rem;
  width: 100vw;
  margin-left: 50%;
  transform: translateX(-50%);
  overflow: hidden;
  position: relative;
  mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
  -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
}

.marketing-marquee-track {
  display: flex;
  width: max-content;
  animation: marquee 30s linear infinite;
  gap: 2rem;
  padding: 1rem 0;
}

.marketing-marquee-track:hover {
  animation-play-state: paused;
}

.marketing-marquee-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 2rem;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 999px;
  font-weight: 700;
  color: var(--color-gray-300);
  font-size: 1.1rem;
  transition: all 0.2s;
  cursor: pointer;
}
.marketing-marquee-item:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(34, 197, 94, 0.3);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(34, 197, 94, 0.1);
}

.broker-logo-placeholder {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: var(--color-brand-500);
}

@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(calc(-50% - 1rem)); }
}

.marketing-integrations-more {
  text-align: center;
  margin-top: 4rem;
  font-size: 0.95rem;
  color: var(--color-gray-400);
  line-height: 1.8;
}
.marketing-integrations-more a {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-profit);
  font-weight: 600;
  margin-top: 0.5rem;
  transition: opacity 0.2s;
}
.marketing-integrations-more a:hover {
  opacity: 0.8;
}

`;
  lines.splice(startIndex, endIndex - startIndex, newCss);
  fs.writeFileSync('src/styles/marketing.css', lines.join('\n'));
  console.log('Successfully replaced Integrations CSS');
} else {
  console.log('Failed', startIndex, endIndex);
}
