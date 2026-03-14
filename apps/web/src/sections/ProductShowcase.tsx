import { motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';
import FlowingRibbons from '@/components/FlowingRibbons';
import DesktopMockup from '@/components/DesktopMockup';

export default function ProductShowcase() {
  return (
    <section className="relative bg-slate-950 text-white py-32 overflow-hidden">
      <FlowingRibbons />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <motion.div
            className="backdrop-blur-sm bg-slate-900/40 p-8 rounded-3xl"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ textShadow: '0 4px 16px rgba(0, 0, 0, 0.4)' }}>
              Plan your day,
              <br />
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                ship on time
              </span>
            </h2>
            <p className="text-xl text-slate-200 mb-8 leading-relaxed">
              Visualize your schedule with color-coded time blocks. GitHub PRs in green, Jira tickets in blue, meetings in purple. Everything organized, nothing overlooked.
            </p>
            <ul className="space-y-4">
              {[
                'Drag-and-drop scheduling',
                'Adaptive task estimation',
                'Auto-sync with your tools',
                'Focus mode with timers',
              ].map((feature, i) => (
                <motion.li
                  key={i}
                  className="flex items-center gap-3 text-lg"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 + 0.2 }}
                >
                  <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                  <span className="text-slate-200">{feature}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <div>
            <DesktopMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
