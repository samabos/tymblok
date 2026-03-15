import { useRef } from 'react';
import { motion, useInView } from 'motion/react';

interface IntegrationItem {
  name: string;
  description: string;
  color: string;
  status: 'available' | 'coming-soon';
}

const integrations: IntegrationItem[] = [
  { name: 'GitHub', description: 'Pull requests, issues, and code reviews flow directly into your timeline.', color: '#24292f', status: 'available' },
  { name: 'Jira', description: 'Sync tickets and sprints. Drag Jira issues into your time blocks.', color: '#0052CC', status: 'available' },
  { name: 'Google Calendar', description: 'Meetings and events auto-populate your schedule. No double-booking.', color: '#4285F4', status: 'available' },
  { name: 'Slack', description: 'Auto-update your status during focus blocks. Snooze notifications when deep in work.', color: '#4A154B', status: 'coming-soon' },
  { name: 'Linear', description: 'Track issues and cycles. Schedule Linear tasks alongside your calendar.', color: '#5E6AD2', status: 'coming-soon' },
  { name: 'Notion', description: 'Pull tasks from Notion databases into your daily plan.', color: '#000000', status: 'coming-soon' },
];

function IntegrationCard({ integration, index }: { integration: IntegrationItem; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      className="relative group"
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <div className="relative bg-white border border-slate-200 rounded-2xl p-6 h-full shadow-sm transition-all duration-300 group-hover:border-indigo-300 group-hover:shadow-md">
        {integration.status === 'coming-soon' && (
          <span className="absolute top-4 right-4 text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
            Coming Soon
          </span>
        )}

        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
          style={{ backgroundColor: `${integration.color}15` }}
        >
          <IntegrationIcon name={integration.name} color={integration.color} />
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-2">{integration.name}</h3>
        <p className="text-slate-600 text-sm leading-relaxed">{integration.description}</p>
      </div>
    </motion.div>
  );
}

function IntegrationIcon({ name, color }: { name: string; color: string }) {
  const icons: Record<string, JSX.Element> = {
    GitHub: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill={color}>
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
      </svg>
    ),
    Jira: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill={color}>
        <path d="M11.571 11.513H0a5.218 5.218 0 005.232 5.215h2.13v2.057A5.215 5.215 0 0012.575 24V12.518a1.005 1.005 0 00-1.005-1.005zm5.723-5.756H5.736a5.215 5.215 0 005.215 5.214h2.129v2.058a5.218 5.218 0 005.215 5.214V6.758a1.001 1.001 0 00-1.001-1.001zM23.013 0H11.455a5.215 5.215 0 005.215 5.215h2.129v2.057A5.215 5.215 0 0024.013 12.487V1.005A1.005 1.005 0 0023.013 0z" />
      </svg>
    ),
    'Google Calendar': (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
    ),
    Slack: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313z" fill="#E01E5A" />
        <path d="M8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312z" fill="#36C5F0" />
        <path d="M18.956 8.834a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zm-1.27 0a2.528 2.528 0 01-2.523 2.521 2.528 2.528 0 01-2.52-2.521V2.522A2.528 2.528 0 0115.163 0a2.528 2.528 0 012.523 2.522v6.312z" fill="#2EB67D" />
        <path d="M15.163 18.956a2.528 2.528 0 012.523 2.522A2.528 2.528 0 0115.163 24a2.528 2.528 0 01-2.52-2.522v-2.522h2.52zm0-1.27a2.528 2.528 0 01-2.52-2.523 2.528 2.528 0 012.52-2.52h6.314A2.528 2.528 0 0124 15.163a2.528 2.528 0 01-2.523 2.523h-6.314z" fill="#ECB22E" />
      </svg>
    ),
    Linear: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill={color}>
        <path d="M2.886 4.18A11.982 11.982 0 0111.99 0C18.624 0 24 5.376 24 12.009c0 3.64-1.62 6.903-4.18 9.105L2.887 4.18zM1.817 5.626l16.556 16.556c-.524.33-1.075.62-1.65.866L.951 7.277c.247-.575.537-1.126.866-1.65zM.322 9.163l14.515 14.515c-.71.172-1.443.282-2.195.322L0 11.358a12 12 0 01.322-2.195zm-.17 4.862l9.823 9.824a12.02 12.02 0 01-9.824-9.824z" />
      </svg>
    ),
    Notion: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill={color}>
        <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.98-.7-2.055-.607L2.592 2.481c-.467.047-.56.28-.374.466l2.241 1.261zM5.252 7.514v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.934-.56.934-1.166V6.674c0-.607-.233-.933-.747-.886l-15.177.886c-.56.047-.747.326-.747.84zm14.336.42c.094.42 0 .84-.42.888l-.7.14v10.264c-.607.327-1.167.514-1.634.514-.747 0-.934-.234-1.494-.933l-4.577-7.186v6.952l1.447.327s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.297 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.886.747-.933l3.222-.186z" />
      </svg>
    ),
  };

  return icons[name] || <div className="w-6 h-6 rounded bg-slate-300" />;
}

export default function Integrations() {
  return (
    <section className="relative bg-white py-20">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Connects with your stack
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Pull tasks, tickets, and events from the tools you already use. One timeline, zero context switching.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration, i) => (
            <IntegrationCard key={integration.name} integration={integration} index={i} />
          ))}
        </div>

        <motion.p
          className="text-center text-slate-400 mt-12 text-sm"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
        >
          More integrations on the way.
        </motion.p>
      </div>
    </section>
  );
}
