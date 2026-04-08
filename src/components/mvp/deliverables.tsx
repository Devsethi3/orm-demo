import Image from "next/image";
import { CircleCheck, ArrowUpRight } from "lucide-react";

const deliverablesList = [
  "Working MVP product",
  "Clean Codebase",
  "Product Documentation",
  "Deployment Infrastructure",
  "Technical Handover",
];

const Deliverables = () => {
  return (
    <section className="relative w-full min-h-screen flex items-center justify-center py-24 px-3 overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-40 mix-blend-luminosity pointer-events-none">
        <Image
          src="/hero.svg"
          alt="Building facade pattern"
          fill
          className="object-cover grayscale contrast-[1.5]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90"></div>

        <div
          className="absolute inset-0 opacity-30 mix-blend-overlay"
          style={{
            backgroundImage:
              "radial-gradient(circle, #000 1px, transparent 1.5px)",
            backgroundSize: "4px 4px",
          }}
        ></div>
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center">
        <div className="text-center mb-16 flex flex-col items-center">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-2.5 bg-white"></div>
            <span className="text-sm uppercase font-chivo-mono">
              What You Get
            </span>
          </div>

          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl mb-6">
            Deliverables
          </h2>

          <p className="text-foreground/80 text-[15px] md:text-base max-w-lg text-center leading-relaxed">
            At the end of the MVP program, founders receive a fully working
            product ready for real users.
          </p>
        </div>

        <div
          className="bg-white text-black w-full max-w-[460px] p-8 md:p-12 relative shadow-2xl"
          style={{
            clipPath: "polygon(0.5% 1%, 99.5% 0%, 100% 99%, 0% 100%)",
          }}
        >
          <div className="relative z-10">
            <h3 className="text-sm mb-8 text-black tracking-wide">Includes:</h3>

            <ul className="space-y-5 mb-12">
              {deliverablesList.map((item, index) => (
                <li key={index} className="flex items-center gap-4 group">
                  <CircleCheck className="size-4 text-black stroke-[1.5] shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="text-[15px] tracking-tight">{item}</span>
                </li>
              ))}
            </ul>

            <button className="w-full bg-black text-white px-6 py-[18px] flex items-center justify-between group transition-colors">
              <span className="text-sm uppercase font-chivo-mono">
                Start MVP Program
              </span>
              <ArrowUpRight className="w-[18px] h-[18px] text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Deliverables;
