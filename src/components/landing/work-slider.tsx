"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "../ui/button";

const slides = [
  {
    id: 1,
    title: "Discovery & Product Definition",
    description:
      "We align on product goals, user needs, and technical direction to create a clear execution plan.",
    image: "/slide-1.svg",
  },
  {
    id: 2,
    title: "UX & System Architecture",
    description:
      "Design and system structure are developed in parallel, ensuring alignment from the start.",
    image: "/slide-2.svg",
  },
  {
    id: 3,
    title: "Development & Execution",
    description:
      "Rigorous engineering sprints deliver scalable, production-ready code with built-in compliance.",
    image: "/slide-1.svg",
  },
  {
    id: 4,
    title: "Development & Execution",
    description:
      "Rigorous engineering sprints deliver scalable, production-ready code with built-in compliance.",
    image: "/slide-2.svg",
  },
];

const WorkSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const nextSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  return (
    <section className="w-full min-h-screen flex items-center py-20 px-3 lg:px-12 overflow-hidden">
      <div className="max-w-[1480px] lg:px-12 w-full mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-24 h-full min-h-[600px]">
        <div className="flex flex-col justify-between h-full pt-4">
          <div className="mb-16 lg:mb-0">
            <div className="flex items-center gap-3 mb-10">
              <div className="size-2.5 bg-white"></div>
              <span className="text-[10px] font-chivo-mono tracking-[0.2em] uppercase">
                How we work
              </span>
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.1] mb-6 font-heading text-muted-foreground">
              A System Built for{" "}
              <span className="text-foreground">Structured Execution</span>
            </h2>

            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-md">
              A structured approach to building products where design,
              engineering, and scalability are considered from day one.
            </p>
          </div>

          <div className="mt-12 lg:mt-auto">
            <div className="flex items-center gap-2 mb-8">
              <Button
                onClick={prevSlide}
                className="w-10 h-10 border hover:border-white/20"
                variant={"outline"}
                aria-label="Previous slide"
              >
                <ChevronLeft />
              </Button>
              <Button
                onClick={nextSlide}
                className="w-10 h-10 border hover:border-white/20"
                variant={"outline"}
                aria-label="Next slide"
              >
                <ChevronRight />
              </Button>
            </div>

            <div className="relative min-h-[120px] mb-6">
              {slides.map((slide, index) => (
                <div
                  key={`text-${slide.id}`}
                  className={`absolute top-0 left-0 w-full transition-all duration-500 ease-in-out ${
                    index === currentIndex
                      ? "opacity-100 translate-y-0 pointer-events-auto"
                      : "opacity-0 translate-y-4 pointer-events-none"
                  }`}
                >
                  <h3 className=" text-base mb-3 tracking-wide">
                    {slide.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-lg">
                    {slide.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="w-full h-px bg-muted max-w-lg"></div>
          </div>
        </div>

        <div className="relative w-full h-[400px] sm:h-[500px] lg:h-full min-h-[500px] flex items-center justify-center lg:justify-end overflow-hidden">
          {slides.map((slide, index) => (
            <div
              key={`img-${slide.id}`}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              <div className="w-full h-full relative flex items-center justify-center lg:justify-end">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="max-h-full max-w-full object-contain object-right 
                               "
                />
                <div className="absolute inset-0 bg-black/20 mix-blend-overlay pointer-events-none"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WorkSlider;
