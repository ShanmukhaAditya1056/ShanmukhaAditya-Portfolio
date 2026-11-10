import { useEffect, useRef } from 'react';
import { MotionConfig } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar.jsx';
import PortfolioFloralBackground from './components/PortfolioFloralBackground.jsx';
import { profile } from './data/profile.js';

/**
 * Layer 1: the single fixed floral background behind every page (styles in index.css → .site-bg).
 * Gentle parallax: the photo is taller than the viewport, so as you scroll the whole site it
 * drifts upward by exactly its overflow, revealing the lower (flower-rich) part by the last page.
 */
function SiteBackground() {
  const img = useRef(null);

  useEffect(() => {
    const el = img.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    let extra = 0;
    let raf = 0;
    const measure = () => {
      el.style.transform = 'none';
      extra = Math.max(0, el.getBoundingClientRect().bottom - window.innerHeight);
      update();
    };
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      el.style.transform = `translate3d(0, ${(-progress * extra).toFixed(1)}px, 0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    measure();
    if (!el.complete) el.addEventListener('load', measure, { once: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
    };
  }, []);

  return (
    <div aria-hidden="true" className="site-bg">
      <img ref={img} src={profile.background} alt="" width="1023" height="767" fetchPriority="high" className="site-bg__photo" />
    </div>
  );
}
import Hero from './sections/Hero.jsx';
import About from './sections/About.jsx';
import Skills from './sections/Skills.jsx';
import Projects from './sections/Projects.jsx';
import Contact from './sections/Contact.jsx';

/**
 * Layering ("sandwich"), lowest first:
 *  z-0  fixed background photo + grid mesh + tint  (SiteBackground below / index.css .site-bg)
 *  z-10 floating petal layer, pointer-events-none   (PortfolioFloralBackground)
 *  z-20 content: text, cards, buttons, portrait     (.canvas / .mpage)
 *  z-50 navbar
 */
export default function App() {
  // Deep links (/#projects) arrive before React has rendered the sections, so jump once mounted.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-linen focus:px-4 focus:py-2 focus:font-semibold focus:text-navy"
      >
        Skip to content
      </a>
      <SiteBackground />
      <Navbar />
      <PortfolioFloralBackground />
      <main id="main">
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Contact />
      </main>
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 4500,
          style: {
            background: 'rgba(11, 37, 69, 0.92)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(12px)',
            fontFamily: 'Montserrat, sans-serif',
            fontSize: '15px',
          },
          success: { iconTheme: { primary: '#FAF0E6', secondary: '#0b2545' } },
        }}
      />
    </MotionConfig>
  );
}
