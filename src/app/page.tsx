import CaseStudiesSection from "@/components/landing/case-studies";
import CompareSection from "@/components/landing/compare-section";
import ExecutionPathsSection from "@/components/landing/execution-paths";
import Footer from "@/components/landing/footer";
import HeroSection from "@/components/landing/hero-section";
import SolutionSection from "@/components/landing/solution-section";
import TechStackSection from "@/components/landing/tech-stack-section";
import WorkSlider from "@/components/landing/work-slider";
import WhoWeWorkWith from "@/components/landing/work-with-section";

const HomePage = () => {
  return (
    <div className="min-h-screen selection:bg-white selection:text-black">
      <HeroSection />
      <SolutionSection />
      <WorkSlider />
      <WhoWeWorkWith />
      <CompareSection />
      <ExecutionPathsSection />
      <TechStackSection />
      <CaseStudiesSection />
      <Footer />
    </div>
  );
};

export default HomePage;
