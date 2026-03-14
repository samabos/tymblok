import { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { Layers, Github, Zap } from 'lucide-react';

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
        className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg"
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <Icon className="w-8 h-8 text-white" />
      </motion.div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}

export default function Features() {
  return (
    <section id="features" className="relative bg-white py-32">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Built for developer workflows
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Not another generic productivity app. Tymblok understands how developers work and integrates with your existing tools.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-12">
          <LightFeatureCard
            icon={Layers}
            title="Visual Time Blocks"
            description="Drag tasks from GitHub, Jira, and Slack into focused time blocks. See your schedule at a glance."
            delay={0.1}
          />
          <LightFeatureCard
            icon={Github}
            title="Developer Integrations"
            description="GitHub PRs, Jira tickets, and Google Calendar in one unified timeline. All your work, one place."
            delay={0.2}
          />
          <LightFeatureCard
            icon={Zap}
            title="Stay in Flow"
            description="Deep work blocks trigger Do Not Disturb. Pomodoro timers and automatic status updates keep you focused."
            delay={0.3}
          />
        </div>
      </div>
    </section>
  );
}
