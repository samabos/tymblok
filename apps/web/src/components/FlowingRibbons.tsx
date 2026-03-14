import { motion } from 'motion/react';

export default function FlowingRibbons({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <svg className="absolute w-full h-full" viewBox="0 0 1440 800" preserveAspectRatio="none">
        <motion.path
          d="M-200,300 Q400,200 800,300 T1800,300 L1800,360 Q1200,260 800,360 T-200,360 Z"
          fill="url(#ribbon1)"
          animate={{
            d: [
              "M-200,300 Q400,200 800,300 T1800,300 L1800,360 Q1200,260 800,360 T-200,360 Z",
              "M-200,280 Q400,220 800,280 T1800,280 L1800,340 Q1200,240 800,340 T-200,340 Z",
              "M-200,300 Q400,200 800,300 T1800,300 L1800,360 Q1200,260 800,360 T-200,360 Z",
            ],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path
          d="M-200,420 Q500,360 900,420 T2000,420 L2000,470 Q1300,410 900,470 T-200,470 Z"
          fill="url(#ribbon2)"
          animate={{
            d: [
              "M-200,420 Q500,360 900,420 T2000,420 L2000,470 Q1300,410 900,470 T-200,470 Z",
              "M-200,400 Q500,380 900,400 T2000,400 L2000,450 Q1300,390 900,450 T-200,450 Z",
              "M-200,420 Q500,360 900,420 T2000,420 L2000,470 Q1300,410 900,470 T-200,470 Z",
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.path
          d="M-200,520 Q600,480 1000,520 T2200,520 L2200,560 Q1400,520 1000,560 T-200,560 Z"
          fill="url(#ribbon3)"
          animate={{
            d: [
              "M-200,520 Q600,480 1000,520 T2200,520 L2200,560 Q1400,520 1000,560 T-200,560 Z",
              "M-200,500 Q600,500 1000,500 T2200,500 L2200,540 Q1400,500 1000,540 T-200,540 Z",
              "M-200,520 Q600,480 1000,520 T2200,520 L2200,560 Q1400,520 1000,560 T-200,560 Z",
            ],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <defs>
          <linearGradient id="ribbon1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <linearGradient id="ribbon2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <linearGradient id="ribbon3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
