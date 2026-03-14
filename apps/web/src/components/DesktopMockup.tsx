import { motion } from 'motion/react';

export default function DesktopMockup() {
  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
    >
      <div className="relative bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-800">
        <div className="bg-slate-800 px-4 py-3 flex items-center gap-2 border-b border-slate-700">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className="flex-1 bg-slate-700 rounded px-3 py-1 ml-4 text-xs text-slate-400">
            tymblok.com
          </div>
        </div>

        <div className="p-8 grid grid-cols-3 gap-4">
          <div className="col-span-1 space-y-3">
            <div className="h-6 bg-indigo-600 rounded w-3/4" />
            <div className="h-4 bg-slate-700 rounded w-full" />
            <div className="h-4 bg-slate-700 rounded w-5/6" />
            <div className="h-4 bg-slate-700 rounded w-full" />
            <div className="mt-6 h-4 bg-slate-700 rounded w-2/3" />
            <div className="h-4 bg-slate-700 rounded w-full" />
          </div>

          <div className="col-span-2 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg" />
              <div className="h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-lg" />
            </div>
            <div className="h-32 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg" />
              <div className="h-16 bg-slate-700 rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      <div className="h-4 bg-gradient-to-b from-slate-700 to-slate-800 rounded-b-xl -mt-1 mx-auto w-[90%]" />
      <div className="h-2 bg-slate-800 rounded-b-lg -mt-1 mx-auto w-[70%]" />
    </motion.div>
  );
}
