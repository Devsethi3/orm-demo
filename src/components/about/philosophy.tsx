import Image from "next/image";
import { Square } from "lucide-react";
import { ClipText, TextScrollRead } from "../ui/text-scroll-read";

const includedFeatures = [
  {
    title: "Structure Over Speed",
    description:
      "Most teams move fast — but without systems. We prioritize structure so speed doesn't create long-term problems.",
  },
  {
    title: "Decision Early Matter",
    description:
      "Early architecture and product decisions define whether a system scales — or breaks later.",
  },
  {
    title: "Build for Real Users",
    description:
      "We don't build demos or temporary solutions. Everything is designed for real users, real scale, and long-term growth.",
  },
];

export default function Philosophy() {
  return (
    <div>
      <section className="relative w-full py-24 selection:bg-black selection: overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image
            src="/hero.svg"
            alt="Architectural background texture"
            fill
            quality={85}
            className="object-cover object-center opacity-[0.25] grayscale contrast-125 brightness-[0.7] mix-blend-luminosity"
          />
          <div
            className="absolute inset-0 opacity-[0.15] mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/80"></div>
        </div>

        <div className="relative z-10 w-full max-w-[1480px] px-3 lg:px-12  mx-auto flex flex-col">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-3 mb-6">
                <Square
                  className="size-3.5 fill-white mb-0.5"
                  strokeWidth={0}
                />
                <span className="uppercase font-chivo-mono text-sm">
                  Our Philosophy
                </span>
              </div>

              <h2 className="text-4xl sm:text-5xl font-heading md:text-[3.5rem] leading-[1.1] text-muted-foreground">
                How We Think About{" "}
                <span className="text-foreground">Building</span>{" "}
                <br className="lg:inline hidden" />{" "}
                <span className="text-foreground">Products</span>
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {includedFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-6 lg:p-7 flex flex-col h-full shadow-lg"
              >
                <h3 className="mb-4 text-black font-chivo-mono font-medium text-lg">
                  {feature.title}
                </h3>
                <p className="text-[#6b6b75] text-[14px] sm:text-[15px] leading-[1.6]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <div className="max-w-[1480px] mx-auto px-3 lg:px-12 py-24">
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-3 mb-6">
            <Square className="size-3.5 fill-white mb-0.5" strokeWidth={0} />
            <span className="uppercase font-chivo-mono text-sm">
              Our Philosophy
            </span>
          </div>
          <h2 className="text-4xl text-muted-foreground font-heading">
            Why Most <span className="text-foreground">Products</span> Fail
          </h2>
          <TextScrollRead
            className="my-6"
            spaceClass="h-0"
            offset={["start end", "end center"]}
          >
            <ClipText className="lg:text-4xl md:text-3xl text-xl font-light bg-[linear-gradient(-90deg,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.8)_50%)]">
              Most products don&apos;t fail because of bad ideas - they fail
              because execution is fragmented. Design and engineering fall out
              of sync. Speed is prioritized over structure. What gets built
              isn&apos;t designed to scale.
            </ClipText>
          </TextScrollRead>
          <span className="lg:text-4xl md:text-2xl text-xl text-foreground/80">
            We exist to fix that.
          </span>
        </div>
      </div>
    </div>
  );
}
