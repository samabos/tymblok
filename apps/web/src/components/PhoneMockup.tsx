import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

export default function PhoneMockup({ variant = 'dark' }: { variant?: 'dark' | 'light' }) {
  const isDark = variant === 'dark';
  const blocks = [
    { time: '9:00', title: 'Stand-up', color: '#a855f7', height: 30 },
    { time: '10:30', title: 'Review PR #247', color: '#10b981', height: 90 },
    { time: '2:00', title: 'Deep work', color: '#3b82f6', height: 120 },
  ];

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
    >
      <div className={`relative w-72 h-[600px] rounded-[3rem] border-8 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'} shadow-2xl overflow-hidden`}>
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 ${isDark ? 'bg-slate-800' : 'bg-slate-200'} rounded-b-2xl z-10`} />

        <div className="p-6 pt-10 h-full overflow-hidden">
          <div className="mb-6">
            <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-wider mb-1`}>Tuesday</div>
            <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Mar 14</div>
          </div>

          <div className="space-y-3">
            {blocks.map((block, i) => (
              <motion.div
                key={i}
                className="relative rounded-xl p-3 overflow-hidden"
                style={{ backgroundColor: block.color, minHeight: `${block.height}px` }}
                initial={{ x: -20, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 + 0.3 }}
              >
                <div className="relative z-10">
                  <div className="text-white/80 text-xs font-mono mb-1">{block.time}</div>
                  <div className="text-white font-semibold">{block.title}</div>
                </div>
                <motion.div
                  className="absolute inset-0 bg-white/10"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
                />
              </motion.div>
            ))}
          </div>

          <motion.div
            className="absolute top-8 right-8 bg-yellow-400 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1"
            animate={{ rotate: [0, -5, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Sparkles className="w-3 h-3" />
            Cooking
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
