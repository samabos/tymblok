import Hero from './sections/Hero';
import Features from './sections/Features';
import ProductShowcase from './sections/ProductShowcase';
import HowItWorks from './sections/HowItWorks';
import BottomCTA from './sections/BottomCTA';
import Footer from './components/Footer';

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <Hero />
      <Features />
      <ProductShowcase />
      <HowItWorks />
      <BottomCTA />
      <Footer />
    </div>
  );
}
