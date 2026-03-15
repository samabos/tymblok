import { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { Layers, Cable, Zap, Inbox, Repeat, CalendarRange } from 'lucide-react';

function LightFeatureCard({ icon: Icon, title, description, delay }: { icon: React.ElementType; title: string; description: string; delay: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      className="text-center"
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.6 }}
    >
      <motion.div
        className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg"
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <Icon className="w-7 h-7 text-white" />
      </motion.div>
      <h3 className="text-base font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}

export default function Features() {
  return (
    <section id="features" className="relative bg-white py-24">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Built for how engineers actually work
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Tymblok understands technical workflows and integrates with your existing tools.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-x-12 gap-y-12">
          <LightFeatureCard icon={Layers} title="Visual Time Blocks" description="Drag tasks into focused time blocks. See your entire day at a glance." delay={0.1} />
          <LightFeatureCard icon={Cable} title="Tool Integrations" description="GitHub, Jira, Google Calendar, and Slack pulled into one timeline." delay={0.2} />
          <LightFeatureCard icon={Zap} title="Stay in Flow" description="Deep work blocks with focus timers. Pause and resume without losing context." delay={0.3} />
          <LightFeatureCard icon={Inbox} title="Smart Inbox" description="Capture tasks from anywhere. Triage and schedule them when you're ready." delay={0.4} />
          <LightFeatureCard icon={Repeat} title="Recurring Blocks" description="Standups, 1:1s, code reviews. Set it once and it auto-populates." delay={0.5} />
          <LightFeatureCard icon={CalendarRange} title="Week Overview" description="Spot overloaded days before they happen. Balance your week." delay={0.6} />
        </div>
      </div>
    </section>
  );
}
