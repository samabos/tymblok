import { motion } from 'motion/react';
import { Users } from 'lucide-react';

export default function SocialProof() {
  return (
    <section className="bg-white border-b border-slate-100 py-10">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-6 text-center"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Users className="w-4 h-4 text-indigo-500" />
            <span>Join <strong className="text-slate-900">500+</strong> engineers on the waitlist</span>
          </div>

          <span className="hidden sm:block text-slate-300">|</span>

          <p className="text-sm text-slate-500">
            Built for teams using GitHub, Jira, and Google Calendar
          </p>
        </motion.div>
      </div>
    </section>
  );
}
