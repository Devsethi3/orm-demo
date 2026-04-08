import HeroSection from "@/components/execution/hero-section";
import Model from "@/components/execution/model";
import SprintEngagementModel from "@/components/execution/sprint-engagement-model";
import WhoWeWorkWith from "@/components/execution/work-with-section";
import CaseStudiesSection from "@/components/landing/case-studies";
import Footer from "@/components/landing/footer";

const ExecutionPage = () => {
  return (
    <div className="min-h-screen selection:bg-white selection:text-black">
      <HeroSection />
      <WhoWeWorkWith />
      <Model />
      <SprintEngagementModel />
      <CaseStudiesSection />
      <Footer />
    </div>
  );
};

export default ExecutionPage;
