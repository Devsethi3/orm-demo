import type { Metadata } from "next";
import ExecutionPaths from "@/components/about/execution-paths";
import HeroSection from "@/components/about/hero-section";
import Philosophy from "@/components/about/philosophy";
import Principle from "@/components/about/principle";
import Footer from "@/components/landing/footer";
import { generatePageMetadata } from "@/lib/metadata";

export const metadata: Metadata = generatePageMetadata("about");

const AboutPage = () => {
  return (
    <div className="min-h-screen selection:bg-white selection:text-black">
      <HeroSection />
      <Philosophy />
      <Principle />
      <ExecutionPaths />
      <Footer />
    </div>
  );
};

export default AboutPage;
