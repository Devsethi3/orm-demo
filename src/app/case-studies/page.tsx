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
    bgImage: "/case-study-texture-1.png",
    uiImage: "/dashboard.svg",
    isLightUi: true,
  },
  {
    id: 2,
    title: "Internal Tooling for workflow automation",
    bgImage: "/case-study-texture-2.png",
    uiImage: "/x-ui.svg",
    isLightUi: false,
  },
  {
    id: 3,
    title: "AI SAAS Platform",
    bgImage: "/case-study-texture-1.png",
    uiImage: "/dashboard.svg",
    isLightUi: true,
  },
  {
    id: 4,
    title: "Typical Approach",
    bgImage: "/case-study-texture-2.png",
    uiImage: "/x-ui.svg",
    isLightUi: false,
  },
  {
    id: 5,
    title: "AI SAAS Platform",
    bgImage: "/case-study-texture-1.png",
    uiImage: "/dashboard.svg",
    isLightUi: true,
  },
  {
    id: 6,
    title: "Typical Approach",
    bgImage: "/case-study-texture-2.png",
    uiImage: "/x-ui.svg",
    isLightUi: false,
  },
];

const CaseStudiesPage = () => {
  return (
    <>
      <section className="px-3 lg:px-12 py-12 sm:py-16 lg:py-24 max-w-[1480px] mx-auto">
        <h1 className="text-4xl sm:text-6xl font-heading leading mb-6 sm:mb-8 text-muted-foreground">
          From Idea to Production <br /> Without{" "}
          <span className="text-foreground">the Chaos</span>
        </h1>
        <p className="text-lg text-muted-foreground">
          A selection of products we&apos;ve designed, built, and scaled.
        </p>
      </section>
      <div className="w-full max-w-[1400px] px-3 lg:px-0 mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
          {caseStudies.map((study) => (
            <article key={study.id} className="flex flex-col group">
              <div className="relative w-full aspect-[16/10] overflow-hidden bg-black mb-6">
                <Image
                  src={study.uiImage}
                  alt={`${study.title} Interface`}
                  fill
                  className="object-contain z-10 pt-7"
                />

                <div
                  className="absolute inset-0 w-full h-full"
                  style={{
                    backgroundImage: `url(${study.bgImage})`,
                    backgroundSize: "cover",

                    clipPath:
                      "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 18% 8%, 82% 8%, 82% 92%, 18% 92%, 18% 8%)",
                  }}
                />
              </div>

              <div>
                <h3 className="font-mono text-sm uppercase tracking-widest text-gray-300">
                  {study.title}
                </h3>
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
