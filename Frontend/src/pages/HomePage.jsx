//src/pages/HomePage.jsx
import React from "react";
import HomeNavbar from "../components/HomeNavbar";

import HeroSection from "../components/HeroSection";
import HowItWorksSection from "../components/HowItWorksSection";
import InstitutionsWeServeSection from "../components/InstitutionsWeServeSection";
import ForFamilyAbroadSection from "../components/ForFamilyAbroadSection";
import PricingSection from "../components/PricingSection";
import TrustSection from "../components/TrustSection";
import SecuritySection from "../components/SecuritySection";
import FAQSection from "../components/FAQSection";
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
      <InstitutionsWeServeSection />
      <ForFamilyAbroadSection />
      <PricingSection />
      <TrustSection />
      <SecuritySection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
}
