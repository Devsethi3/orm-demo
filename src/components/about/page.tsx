import HeroSection from "@/components/about/hero-section";
import Philosophy from "@/components/about/philosophy";

const AboutPage = () => {
  return (
    <div className="min-h-screen selection:bg-white selection:text-black">
      <HeroSection />
      <Philosophy />
      
    </div>
  );
};

export default AboutPage;
