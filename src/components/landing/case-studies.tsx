import Image from "next/image";
import { ArrowUpRightIcon } from "lucide-react";
import { Button } from "../ui/button";
import { SectionLabel } from "../ui/section-label";

const caseStudies = [
  {
    id: 1,
    title: "AI SAAS Platform",
    bgImage: "/hero.svg",
    uiImage: "/dashboard.svg",
    isLightUi: true,
  },
  {
    id: 2,
    title: "Typical Approach",
    bgImage: "/hero.svg",
    uiImage: "/x-ui.svg",
    isLightUi: false,
  },
];

export default function CaseStudiesSection() {
  return (
    <section className="w-full min-h-screen bg-black text-white py-24 px-3 md:px-12 selection:bg-white selection:text-black flex flex-col items-center">
      <div className="w-full max-w-[1400px] flex flex-col items-start mb-16 lg:mb-24">
        <SectionLabel text="Case Studies" />

        <div className="flex flex-col max-w-2xl">
          <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] text-muted-foreground mb-8">
            Built for{" "}
            <span className="text-foreground italic">Real Products</span>, Not{" "}
            <br className="hidden sm:block" />
            Just Ideas
          </h2>
          <p className="text-[#a1a1aa] text-[15px] sm:text-[17px] leading-relaxed max-w-[500px]">
            A look at how we&apos;ve helped teams design, build, and scale
            production-ready products.
          </p>
        </div>
      </div>

      <div className="w-full max-w-[1400px] grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
        {caseStudies.map((study) => (
          <article
            key={study.id}
            className="flex flex-col group cursor-pointer"
          >
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] overflow-hidden bg-[#111] mb-6 border border-[#222]">
              <Image
                src={study.bgImage}
                alt="Background texture"
                fill
                className="absolute inset-0 object-cover grayscale mix-blend-luminosity opacity-40"
              />

              <div className="absolute inset-0 p-4 sm:p-8 flex items-center justify-center">
                <Image
                  src={study.uiImage}
                  alt={`${study.title} Interface`}
                  fill
                  className={`object-cover mt-16
                    ${study.isLightUi ? "brightness-110" : "brightness-90"}
                  `}
                />
              </div>

              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] mix-blend-overlay pointer-events-none opacity-50"></div>
            </div>

            <div>
              <h3 className="font-chivo-mono">{study.title}</h3>
            </div>
          </article>
        ))}
      </div>

      <div className="w-full flex justify-center mt-20">
        <Button className="h-10 text-sm" variant={"secondary"}>
          See all
          <ArrowUpRightIcon />
        </Button>
      </div>
    </section>
  );
}
