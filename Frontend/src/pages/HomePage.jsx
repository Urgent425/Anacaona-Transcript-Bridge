//src/pages/HomePage.jsx
import React from "react";
import HomeNavbar from "../components/HomeNavbar";

import HeroSection from "../components/HeroSection";
import HowItWorksSection from "../components/HowItWorksSection";
import PricingSection from "../components/PricingSection";
import SecuritySection from "../components/SecuritySection";
import CTASection from "../components/CTASection";
import Footer from "../components/Footer";

export default function HomePage() {
  return (
    <div className="font-sans bg-slate-950 text-white">
      {/* NAVBAR stays on top */}
      <HomeNavbar />

      {/* PAGE SECTIONS */}
      <HeroSection />
      <HowItWorksSection />
      <PricingSection />
      <SecuritySection />
      <CTASection />
      <Footer />
    </div>
  );
}
