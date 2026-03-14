import BlockTowerLogo from './BlockTowerLogo';

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <BlockTowerLogo size={24} variant="color" />
            <span className="text-sm text-slate-400">
              &copy; {new Date().getFullYear()} Tymblok. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-8">
            <a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-slate-400 hover:text-white transition-colors">How it Works</a>
            <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Privacy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
