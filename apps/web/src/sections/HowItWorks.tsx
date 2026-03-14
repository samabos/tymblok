import { motion } from 'motion/react';

const steps = [
  { num: '01', title: 'Import', desc: 'Connect GitHub, Jira, and your calendar. All your tasks in one place.' },
  { num: '02', title: 'Schedule', desc: 'Drag tasks into time blocks. Plan your day around deep work and meetings.' },
  { num: '03', title: 'Focus', desc: 'Work through blocks with built-in timers. Stay in flow with Do Not Disturb.' },
  { num: '04', title: 'Ship', desc: 'Complete tasks, close tickets, merge PRs. Track your productivity over time.' },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative bg-slate-50 py-32">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            How it works
          </h2>
          <p className="text-xl text-slate-600">
            Four simple steps to take control of your dev day
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              className="relative bg-white rounded-2xl p-8 shadow-lg border border-slate-200"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <div className="absolute -top-6 -left-6 w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {step.num}
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3 mt-4">{step.title}</h3>
              <p className="text-slate-600 leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
