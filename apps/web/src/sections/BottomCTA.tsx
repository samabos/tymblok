import { motion } from 'motion/react';
import FlowingRibbons from '@/components/FlowingRibbons';
import WaitlistForm from '@/components/WaitlistForm';

export default function BottomCTA() {
  return (
    <section id="waitlist" className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white py-32 overflow-hidden">
      <FlowingRibbons />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          className="backdrop-blur-sm bg-slate-900/40 p-12 rounded-3xl"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
            style={{ textShadow: '0 4px 16px rgba(0, 0, 0, 0.4)' }}
          >
            Ready to take control of
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              your dev day?
            </span>
          </h2>
          <p className="text-xl text-slate-200 mb-12 max-w-2xl mx-auto leading-relaxed">
            Join the waitlist and be the first to experience time blocking designed specifically for developers.
          </p>

          <div className="flex justify-center mb-6">
            <WaitlistForm source="bottom-cta" variant="dark" />
          </div>

          <p className="text-sm text-slate-400">
            Free to join - No spam - We'll notify you when Tymblok launches
          </p>
        </motion.div>
      </div>
    </section>
  );
}
