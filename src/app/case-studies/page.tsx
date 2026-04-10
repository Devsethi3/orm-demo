import type { Metadata } from "next";
import Image from "next/image";
import Footer from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { ArrowUpRightIcon } from "lucide-react";
import { generatePageMetadata } from "@/lib/metadata";

export const metadata: Metadata = generatePageMetadata("caseStudies");

const caseStudies = [
  {
    id: 1,
    title: "AI SAAS Platform For Customer Operations",
    bgImage: "/hero.svg",
    uiImage: "/dashboard.svg",
    isLightUi: true,
  },
  {
    id: 2,
    title: "Internal Tooling for workflow automation",
    bgImage: "/hero.svg",
    uiImage: "/x-ui.svg",
    isLightUi: false,
  },
  {
    id: 3,
    title: "AI SAAS Platform",
    bgImage: "/hero.svg",
    uiImage: "/dashboard.svg",
    isLightUi: true,
  },
  {
    id: 4,
    title: "Typical Approach",
    bgImage: "/hero.svg",
    uiImage: "/x-ui.svg",
    isLightUi: false,
  },
  {
    id: 5,
    title: "AI SAAS Platform",
    bgImage: "/hero.svg",
    uiImage: "/dashboard.svg",
    isLightUi: true,
  },
  {
    id: 6,
    title: "Typical Approach",
    bgImage: "/hero.svg",
    uiImage: "/x-ui.svg",
    isLightUi: false,
  },
];

const CaseStudiesPage = () => {
  return (
    <>
      <section className="px-3 lg:px-12 py-12 sm:py-16 lg:py-24 max-w-[1480px] mx-auto">
        <h1 className="text-4xl sm:text-6xl font-heading leading mb-6 sm:mb-8 text-muted-foreground">
          From Idea to Production - <br /> Without{" "}
          <span className="text-foreground italic">the Chaos</span>
        </h1>
        <p className="text-lg text-muted-foreground">
          A selection of products we&apos;ve designed, built, and scaled.
        </p>
      </section>
      <div className="w-full max-w-[1400px] px-3 lg:px-0 mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
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

      <div className="w-full flex justify-center my-20">
        <Button className="h-10 text-sm" variant={"secondary"}>
          See more
          <ArrowUpRightIcon />
        </Button>
      </div>
      <Footer />
    </>
  );
};

export default CaseStudiesPage;
