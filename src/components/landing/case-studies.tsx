import Image from "next/image";
import { ArrowUpRightIcon } from "lucide-react";
import { Button } from "../ui/button";
import { SectionLabel } from "../ui/section-label";
import { AnimatedShinyText } from "../ui/animated-shiny-text";
import Link from "next/link";

const caseStudies = [
  {
    id: 1,
    title: "AI SAAS Platform",
    bgImage: "/case-study-texture-1.png",
    uiImage: "/dashboard.svg",
  },
  {
    id: 2,
    title: "Typical Approach",
    bgImage: "/case-study-texture-2.png",
    uiImage: "/x-ui.svg",
  },
];

export default function CaseStudiesSection() {
  return (
    <section className="w-full min-h-screen bg-black text-white py-24">
      <div className="w-full max-w-[1480px]  px-3 lg:px-12 mx-auto">
        <div className="mb-16 lg:mb-24">
          <SectionLabel text="Case Studies" />
          <div className="flex flex-col gap-8 text-muted-foreground">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-heading">
              <span className="text-foreground">Built for</span> <AnimatedShinyText>Real Products</AnimatedShinyText>
              , Not <br className="hidden sm:block" />
              Just <span className="text-foreground">Ideas</span>
            </h2>
            <p className="text-muted-foreground max-w-sm">
              A look at how we&apos;ve helped teams design, build, and scale
              production-ready products.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
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

        <div className="w-full flex justify-center mt-20">
          <Link href="/case-studies">
            <Button
              className="h-11 px-8 text-sm gap-2 group"
              variant={"secondary"}
            >
              See All
              <ArrowUpRightIcon className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
