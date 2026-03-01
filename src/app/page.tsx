import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import PricingPreview from "@/components/landing/PricingPreview";
import CTA from "@/components/landing/CTA";

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <PricingPreview />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
