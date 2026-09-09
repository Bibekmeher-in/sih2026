import React from "react";
import { Navbar } from "@/components/landing/navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { ProblemSection } from "@/components/landing/problem-section";
import { HowItWorksSection } from "@/components/landing/how-it-works";
import { FarmerBenefitsSection } from "@/components/landing/farmer-benefits";
import { BuyerBenefitsSection } from "@/components/landing/buyer-benefits";
import { AICapabilitiesSection } from "@/components/landing/ai-capabilities";
import { LogisticsSection } from "@/components/landing/logistics-section";
import { MarketplacePreviewSection } from "@/components/landing/marketplace-preview";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <ProblemSection />
        <HowItWorksSection />
        <FarmerBenefitsSection />
        <BuyerBenefitsSection />
        <AICapabilitiesSection />
        <LogisticsSection />
        <MarketplacePreviewSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
