import {
  AlertTriangleIcon,
  ClockIcon,
  CloudSyncIcon,
  LayersIcon,
  LinkIcon,
  RocketIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
} from "lucide-react";
import Image from "next/image";
import React from "react";
import { SectionLabel } from "../ui/section-label";
import { AnimatedShinyText } from "../ui/animated-shiny-text";

interface CornerBracketProps {
  position: "tl" | "tr" | "bl" | "br";
  colorClass: string;
}

const CornerBracket: React.FC<CornerBracketProps> = ({
  position,
  colorClass,
}) => {
  const size = 12;
  const offset = -2.5;

  const borderStyles: React.CSSProperties = {
    position: "absolute",
    width: `${size}px`,
    height: `${size}px`,
    pointerEvents: "none",
    zIndex: 10,
    ...(position.includes("t") && { top: `${offset}px` }),
    ...(position.includes("b") && { bottom: `${offset}px` }),
    ...(position.includes("l") && { left: `${offset}px` }),
    ...(position.includes("r") && { right: `${offset}px` }),
    borderStyle: "solid",
    borderColor: colorClass.includes("white") ? "#ffffff" : "#ffffff",
    borderTopWidth: position.includes("t") ? "2px" : "0",
    borderBottomWidth: position.includes("b") ? "2px" : "0",
    borderLeftWidth: position.includes("l") ? "2px" : "0",
    borderRightWidth: position.includes("r") ? "2px" : "0",
  };

  return <div style={borderStyles} />;
};

interface ComparisonItem {
  text: string;
  icon: React.ReactNode;
}

interface ComparisonRow {
  typical: ComparisonItem;
  our: ComparisonItem;
}

const comparisonRows: ComparisonRow[] = [
  {
    typical: {
      text: "Chasing speed with random AI tools",
      icon: <ClockIcon className="size-4.5" />,
    },
    our: {
      text: "AI-accelerated, engineering-first execution",
      icon: <ClockIcon className="size-4.5" />,
    },
  },
  {
    typical: {
      text: "Design and development happen in silos",
      icon: <LinkIcon className="size-4.5" />,
    },
    our: {
      text: "Design and engineering run in parallel",
      icon: <LinkIcon className="size-4.5" />,
    },
  },
  {
    typical: {
      text: "Built for quick launch",
      icon: <RocketIcon className="size-4.5" />,
    },
    our: {
      text: "Built for long-term scale",
      icon: <LayersIcon className="size-4.5" />,
    },
  },
  {
    typical: {
      text: "Technical debt accumulates early",
      icon: <AlertTriangleIcon className="size-4.5" />,
    },
    our: {
      text: "Clean, structured systems from day one",
      icon: <ShieldCheckIcon className="size-4.5" />,
    },
  },
  {
    typical: {
      text: "Compliance handled later (or ignored)",
      icon: <ShieldAlertIcon className="size-4.5" />,
    },
    our: {
      text: "Compliance considered from the start",
      icon: <ShieldCheckIcon className="size-4.5" />,
    },
  },
  {
    typical: {
      text: "Slower iteration over time",
      icon: <ClockIcon className="size-4.5" />,
    },
    our: {
      text: "Faster iteration with stability",
      icon: <CloudSyncIcon className="size-4.5" />,
    },
  },
];

const CompareSection: React.FC = () => {
  return (
    <section className="bg-black text-white py-20  w-full selection:bg-white selection:text-black">
      <div className="max-w-[1480px] px-3 lg:px-12 mx-auto">
        <div className="mb-16">
          <SectionLabel text="We vs Others" />

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-end">
            <h2 className="font-heading text-4xl text-muted-foreground sm:text-5xl lg:text-[3.5rem] leading-[1.1]">
              Move <span className="text-foreground">Faster Without</span>{" "}
              Breaking <br className="hidden sm:block" />
              <AnimatedShinyText>Your Product</AnimatedShinyText>
            </h2>
            <p className="text-[#8a8a93] text-[15px] sm:text-base leading-relaxed max-w-lg mb-2">
              Most teams optimize for speed and pay for it later. We optimize
              for speed and structure from the start.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-6 mt-12">
          <div className="flex flex-col">
            <h3 className="font-chivo-mono text-muted-foreground mb-6 ml-2">
              Typical Approach
            </h3>

            <div className="relative bg-[#0a0a0a] border border-[#1a1a1a] p-8 sm:p-10 min-h-[400px]">
              <CornerBracket position="tl" colorClass="border-white" />
              <CornerBracket position="tr" colorClass="border-white" />
              <CornerBracket position="bl" colorClass="border-white" />
              <CornerBracket position="br" colorClass="border-white" />

              <ul className="flex flex-col gap-6 justify-between h-full">
                {comparisonRows.map((row, idx) => (
                  <li
                    key={`typical-${idx}`}
                    className="flex items-center gap-5 text-muted-foreground"
                  >
                    <span className="shrink-0">{row.typical.icon}</span>
                    <span className="text-sm">{row.typical.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col mt-8 lg:mt-0">
            <div className="flex items-center gap-3 mb-6 ml-2">
              <Image
                src={"/logo.svg"}
                alt="Logo"
                width={35}
                height={35}
                className="absolute"
              />
              <h3 className="tracking-widest font-chivo-mono pl-10">
                Our Approach
              </h3>
            </div>

            <div className="relative bg-[#0a0a0a] border border-white/70 p-8 sm:p-10 min-h-[400px]">
              <CornerBracket position="tl" colorClass="border-white" />
              <CornerBracket position="tr" colorClass="border-white" />
              <CornerBracket position="bl" colorClass="border-white" />
              <CornerBracket position="br" colorClass="border-white" />

              <ul className="flex flex-col gap-6 justify-between h-full">
                {comparisonRows.map((row, idx) => (
                  <li
                    key={`our-${idx}`}
                    className="flex items-center gap-5 text-white"
                  >
                    <span className="shrink-0">{row.our.icon}</span>
                    <span className="text-[14px] sm:text-[15px] ">
                      {row.our.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-20 flex flex-row items-center justify-center gap-10 sm:gap-32 pb-10">
          <div className="text-center">
            <p className="lg:text-4xl text-3xl font-medium font-mono mb-3">
              50%
            </p>
            <p className="text-[13px] text-foreground/70">
              Faster Product Delivery
            </p>
          </div>
          <div className="text-center">
            <p className="lg:text-4xl text-3xl font-medium font-mono mb-3">
              30%
            </p>
            <p className="text-[13px] text-foreground/70">
              More Capital-Efficient
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CompareSection;
