import { useState } from 'react';
import { motion } from 'framer-motion';

// The one petal artwork used across the whole UI (client/public/assets/petal.png).
const PETAL = '/assets/petal.png';
const COUNT = 22;

const rand = (a, b) => a + Math.random() * (b - a);

function makePetal(id) {
  const depth = Math.random(); // 0 = far (smaller, slower, dimmer) … 1 = near (a little larger, faster)
  const fromLeft = Math.random() < 0.8; // the breeze mostly blows left → right
  return {
    id,
    fromLeft,
    y: rand(4, 92), // % down the viewport
    delay: rand(-20, 0), // negative offset → petals are already spread across the screen on first paint
    duration: 16 + (1 - depth) * 12 + rand(0, 4), // seconds for one side-to-side pass
    size: 10 + depth * 14, // small: 10–24px wide
    rotation: rand(0, 360),
    spin: (Math.random() < 0.5 ? -1 : 1) * rand(200, 520),
    bob: rand(18, 48), // vertical sway while drifting
    flipPeriod: rand(2, 4),
    opacity: 0.55 + depth * 0.4,
    blur: depth > 0.85 ? (depth - 0.85) * 8 : 0,
  };
}

/**
 * Layer 2 of the background sandwich: small petals blowing across the viewport from the side.
 * Fixed, `pointer-events-none`, so it never intercepts clicks.
 */
export default function PortfolioFloralBackground() {
  const [petals] = useState(() => Array.from({ length: COUNT }, (_, i) => makePetal(i)));

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
      {petals.map((p) => {
        const start = p.fromLeft ? '-12vw' : '112vw';
        const end = p.fromLeft ? '112vw' : '-12vw';
        return (
          <motion.img
            key={p.id}
            src={PETAL}
            alt=""
            draggable={false}
            className="pointer-events-none absolute left-0 origin-center select-none will-change-transform"
            style={{
              top: `${p.y}%`,
              width: p.size,
              height: 'auto',
              opacity: p.opacity,
              filter: p.blur ? `blur(${p.blur.toFixed(1)}px)` : undefined,
            }}
            initial={{ x: start, y: 0, rotate: p.rotation, scaleX: 1 }}
            animate={{
              x: end,
              y: [0, -p.bob, p.bob * 0.6, -p.bob * 0.4, 0], // gentle up/down bob while gliding
              rotate: p.rotation + p.spin,
              scaleX: [1, 0.25, 1, -0.4, 1], // twisting / flipping in the breeze
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: 'linear',
              y: { duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut', times: [0, 0.25, 0.5, 0.75, 1] },
              scaleX: { duration: p.flipPeriod, delay: p.delay, repeat: Infinity, ease: 'easeInOut' },
            }}
          />
        );
      })}
    </div>
  );
}
