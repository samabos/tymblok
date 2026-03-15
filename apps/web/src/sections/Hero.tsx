import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Menu, X, Users } from 'lucide-react';
import BlockTowerLogo from '@/components/BlockTowerLogo';
import FlowingRibbons from '@/components/FlowingRibbons';
import PhoneMockup from '@/components/PhoneMockup';
import WaitlistForm from '@/components/WaitlistForm';

export default function Hero() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <section className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      <FlowingRibbons />

      {/* Navigation */}
      <motion.nav
        className="relative z-20 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3">
          <BlockTowerLogo size={32} variant="color" />
          <span className="text-xl font-bold">
            Tymblok
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-slate-300 hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="text-sm text-slate-300 hover:text-white transition-colors">How it Works</a>
          <motion.a
            href="#waitlist"
            className="px-6 py-2.5 bg-white text-slate-900 rounded-lg text-sm font-semibold hover:bg-slate-100 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Join Waitlist
          </motion.a>
        </div>

        <button
          className="md:hidden p-2 text-slate-300 hover:text-white transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="relative z-20 md:hidden px-6 pb-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col gap-4 bg-slate-900/80 backdrop-blur-sm rounded-2xl p-6">
              <a href="#features" className="text-sm text-slate-300 hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>Features</a>
              <a href="#how-it-works" className="text-sm text-slate-300 hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>How it Works</a>
              <a
                href="#waitlist"
                className="px-6 py-2.5 bg-white text-slate-900 rounded-lg text-sm font-semibold text-center hover:bg-slate-100 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Join Waitlist
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 pb-40">
        <div className="max-w-3xl backdrop-blur-sm bg-slate-950/40 p-8 rounded-3xl">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-sm text-indigo-300 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Sparkles className="w-4 h-4" />
            <span>Coming Soon</span>
          </motion.div>

          <motion.h1
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-8 leading-tight pt-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ textShadow: '0 4px 24px rgba(0, 0, 0, 0.5)' }}
          >
            Adaptive Time Blocking
            <br />
            <span
              className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 inline-block mt-2 pb-1"
              style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
            >
              For Technical Teams
            </span>
          </motion.h1>

          <motion.p
            className="text-xl text-slate-300 mb-10 leading-relaxed max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Plan your day around PRs, tickets, and deep work. Tymblok syncs with GitHub, Jira, and your calendar to keep you focused on what matters.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <WaitlistForm source="hero" variant="dark" />
          </motion.div>

          <motion.div
            className="flex items-center gap-2 mt-6 text-sm text-slate-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Join <strong className="text-slate-200">500+</strong> engineers on the waitlist</span>
          </motion.div>
        </div>

        {/* Floating phone mockup */}
        <div className="absolute right-10 top-1/2 -translate-y-1/2 hidden lg:block">
          <PhoneMockup variant="dark" />
        </div>
      </div>
    </section>
  );
}
