import { useEffect } from 'react';
import { MotionConfig } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar.jsx';
import PortfolioFloralBackground from './components/PortfolioFloralBackground.jsx';
import Hero from './sections/Hero.jsx';
import About from './sections/About.jsx';
import Skills from './sections/Skills.jsx';
import Projects from './sections/Projects.jsx';
import Contact from './sections/Contact.jsx';

/**
 * Layering ("sandwich"), lowest first:
 *  z-0  page background photo + grid mesh + tint   (Page.jsx / index.css)
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
