import Hero from './sections/Hero';
import Features from './sections/Features';
import HowItWorks from './sections/HowItWorks';
import ProductShowcase from './sections/ProductShowcase';
import Integrations from './sections/Integrations';
import BottomCTA from './sections/BottomCTA';
import Footer from './components/Footer';

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <Hero />
      <Features />
      <ProductShowcase />
      <HowItWorks />
      <Integrations />
      <BottomCTA />
      <Footer />
    </div>
  );
}
