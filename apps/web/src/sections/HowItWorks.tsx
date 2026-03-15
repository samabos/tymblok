import { motion } from 'motion/react';
import { Import, CalendarClock, Timer, Rocket } from 'lucide-react';

const steps = [
  { icon: Import, title: 'Import', desc: 'Connect GitHub, Jira, and your calendar. All tasks in one place.' },
  { icon: CalendarClock, title: 'Schedule', desc: 'Drag tasks into time blocks. Plan your day around deep work.' },
  { icon: Timer, title: 'Focus', desc: 'Work through blocks with built-in timers. Stay in flow.' },
  { icon: Rocket, title: 'Ship', desc: 'Close tickets, hit deadlines, and track your productivity.' },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-slate-50 py-24">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            How it works
          </h2>
          <p className="text-lg text-slate-600">
            Four steps from chaos to shipped
          </p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={i}
                className="relative bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -4 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-bold text-indigo-500 tracking-wider">STEP {i + 1}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{step.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
