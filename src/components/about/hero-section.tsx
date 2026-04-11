import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import { AnimatedShinyText } from "../ui/animated-shiny-text";
import { AnimatedShinyButton } from "../ui/animated-shiny-button";
import { ShinyButton } from "../ui/shiny-button";

const HeroSection = () => {
  return (
    <div>
      <section className="relative px-3 lg:px-12 py-12 sm:py-16 lg:py-24 max-w-[1480px] mx-auto z-10 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-12 lg:gap-8">
        <div className="w-full">
          <h1 className="text-4xl sm:text-6xl font-heading mb-6 sm:mb-8 text-muted-foreground">
            We <span className="text-foreground">Build Products</span> That Are <br /> <span className="text-foreground">Meant</span> <AnimatedShinyText>to Scale</AnimatedShinyText>
          </h1>

          <p className="text-[#888888] text-[15px] leading-relaxed max-w-[460px]">
            Xocket helps with founders and teams to design, build, and scale
            production-ready products - with the systems, structure, and
            engineering discipline most teams lack.
          </p>
        </div>

        <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center gap-4 shrink-0">
          <AnimatedShinyButton url="/mvp">Start MVP Program</AnimatedShinyButton>
          <Link href="/contact-us">
            <ShinyButton>Book Strategy Call</ShinyButton>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HeroSection;
