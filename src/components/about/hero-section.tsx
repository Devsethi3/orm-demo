import { ArrowUpRight } from "lucide-react";
import { Button } from "../ui/button";

const HeroSection = () => {
  return (
    <div>
      <section className="relative px-3 lg:px-12 py-12 sm:py-16 lg:py-24 max-w-[1480px] mx-auto z-10 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-12 lg:gap-8">
        <div className="w-full">
          <h1 className="text-4xl sm:text-6xl font-heading mb-6 sm:mb-8 text-muted-foreground">
            We Build Products That Are <br /> Meant{" "}
            <span className="text-foreground">to Scale</span>
          </h1>

          <p className="text-[#888888] text-[15px] leading-relaxed max-w-[460px]">
            Xocket helps with founders and teams to design, build, and scale
            production-ready products - with the systems, structure, and
            engineering discipline most teams lack.
          </p>
        </div>

        <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center gap-4 shrink-0">
          <Button
            size={"lg"}
            className="w-full sm:w-auto flex items-center justify-between sm:justify-center gap-6 group h-11"
          >
            <span className="text-sm uppercase mt-[2px]">
              Start MVP Program
            </span>
            <ArrowUpRight
              className="size-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
              strokeWidth={1.5}
            />
          </Button>

          <Button
            size={"lg"}
            variant={'secondary'}
            className="w-full sm:w-auto flex items-center justify-between sm:justify-center gap-6 group h-11"
          >
            <span className="text-sm uppercase mt-[2px]">
              Book Strategy Call
            </span>
            <ArrowUpRight
              className="size-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
              strokeWidth={1.5}
            />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default HeroSection;
