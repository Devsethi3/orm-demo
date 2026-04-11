import Image from "next/image";
import React from "react";

interface WorkItem {
  title: string;
  description: string;
  icon: string;
}

const workData: WorkItem[] = [
  {
    title: "Growing Startup Teams",
    description:
      "Moving fast, but need structure to scale without breaking the product.",
    icon: "/icons/bulb.svg",
  },
  {
    title: "Product Teams Under Pressure",
    description:
      "Shipping fast while maintaining performance, reliability, and quality.",
    icon: "/icons/users.svg",
  },
  {
    title: "Venture-Backed Companies",
    description:
      "Scaling products that require performance, reliability, and long-term stability.",
    icon: "/icons/trend.svg",
  },
  {
    title: "Enterprise Innovation Teams",
    description:
      "Products that must meet compliance and system-level requirements.",
    icon: "/icons/building.svg",
  },
];

interface MarkerCornerProps {
  position: "tl" | "tr" | "bl" | "br";
}

const MarkerCorner: React.FC<MarkerCornerProps> = ({ position }) => {
  const borderStyles: React.CSSProperties = {
    position: "absolute",
    width: "10px",
    height: "10px",
    borderColor: "#ffffff",
    borderStyle: "solid",
    zIndex: 10,
    ...(position === "tl" && {
      top: "-1px",
      left: "-1px",
      borderTopWidth: "2px",
      borderLeftWidth: "2px",
      borderRightWidth: "0",
      borderBottomWidth: "0",
    }),
    ...(position === "tr" && {
      top: "-1px",
      right: "-1px",
      borderTopWidth: "2px",
      borderRightWidth: "2px",
      borderLeftWidth: "0",
      borderBottomWidth: "0",
    }),
    ...(position === "bl" && {
      bottom: "-1px",
      left: "-1px",
      borderBottomWidth: "2px",
      borderLeftWidth: "2px",
      borderTopWidth: "0",
      borderRightWidth: "0",
    }),
    ...(position === "br" && {
      bottom: "-1px",
      right: "-1px",
      borderBottomWidth: "2px",
      borderRightWidth: "2px",
      borderTopWidth: "0",
      borderLeftWidth: "0",
    }),
  };

  return <div style={borderStyles} />;
};

interface MarkerTProps {
  position: "top" | "bottom";
  className?: string;
}

const MarkerT: React.FC<MarkerTProps> = ({ position, className = "" }) => {
  if (position === "top") {
    return (
      <div
        className={`absolute top-0 -translate-y-[1px] -translate-x-1/2 flex flex-col items-center z-10 ${className}`}
      >
        <div className="w-[15px] h-[2px] bg-white"></div>
        <div className="w-[2px] h-[8px] bg-white"></div>
      </div>
    );
  }
  if (position === "bottom") {
    return (
      <div
        className={`absolute bottom-0 translate-y-[1px] -translate-x-1/2 flex flex-col items-center z-10 ${className}`}
      >
        <div className="w-[2px] h-[8px] bg-white"></div>
        <div className="w-[15px] h-[1.5px] bg-white"></div>
      </div>
    );
  }
  return null;
};

const WhoWeWorkWith: React.FC = () => {
  return (
    <section className="bg-black text-white py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-12 w-full flex flex-col items-center selection:bg-white selection:text-black">
      <div className="max-w-[1480px] mx-auto flex justify-center flex-col items-center lg:px-12 px-3">
        <div className="flex flex-col items-center text-center max-w-2xl mb-12 sm:mb-16 md:mb-20">
          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <div className="size-2.5 bg-white"></div>
            <span className="text-xs uppercase tracking-[0.2em] font-chivo-mono">
              Who we work for
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-medium text-muted-foreground mb-4 sm:mb-6 px-4">
            Who We Work <span className="text-foreground">With</span>
          </h2>

          <p className="text-[#a1a1aa] text-sm sm:text-base md:text-lg leading-relaxed font-light px-4">
            We partner with teams that care about building products the
            <br className="hidden sm:block" /> right way from the start.
          </p>
        </div>

        <div className="w-full relative border-y border-[#333]">
          <MarkerCorner position="tl" />
          <MarkerCorner position="tr" />
          <MarkerCorner position="bl" />
          <MarkerCorner position="br" />

          <MarkerT position="top" className="hidden lg:flex left-[25%]" />
          <MarkerT position="top" className="hidden lg:flex left-[50%]" />
          <MarkerT position="top" className="hidden lg:flex left-[75%]" />

          <MarkerT position="bottom" className="hidden lg:flex left-[25%]" />
          <MarkerT position="bottom" className="hidden lg:flex left-[50%]" />
          <MarkerT position="bottom" className="hidden lg:flex left-[75%]" />

          <MarkerT
            position="top"
            className="hidden md:flex lg:hidden left-[50%]"
          />
          <MarkerT
            position="bottom"
            className="hidden md:flex lg:hidden left-[50%]"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#333] bg-[#0c0c0c]">
            {workData.map((item, index) => (
              <div
                key={index}
                className="flex flex-col p-6 lg:p-7 min-h-[260px] sm:min-h-[280px] bg-[#0c0c0c]"
              >
                <Image
                  src={item.icon}
                  alt={item.title}
                  width={30}
                  height={30}
                  className="mb-4 sm:mb-6"
                />
                <div className="mt-auto">
                  <h3 className="text-base sm:text-lg text-white mb-2 sm:mb-3 tracking-wide">
                    {item.title}
                  </h3>
                  <p className="text-[#888] text-[13px] sm:text-[14px] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhoWeWorkWith;
