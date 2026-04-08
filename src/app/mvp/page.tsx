import CaseStudiesSection from "@/components/landing/case-studies";
import Footer from "@/components/landing/footer";
import Deliverables from "@/components/mvp/deliverables";
import HeroSection from "@/components/mvp/hero-section";
import Timeline from "@/components/mvp/timeline";
import WhatsIncludedSection from "@/components/mvp/whats-included-section";
import WhoWeWorkWith from "@/components/mvp/work-with-section";

const MVPPage = () => {
  return (
    <div className="min-h-screen selection:bg-white selection:text-black">
      <HeroSection />
      <WhoWeWorkWith />
      <WhatsIncludedSection />
      <Timeline />
      <Deliverables />
      <CaseStudiesSection />
      <Footer />
    </div>
  );
};

export default MVPPage;
