import type { Metadata } from "next";

export const pageMetadata = {
  home: {
    title: "Xocket | Your Structured Startup Execution Partner",
    description:
      "Partner with Xocket for structured product execution and scaling. Design, build, and launch production-ready products with proven methodologies and support.",
    keywords: [
      "startup execution",
      "product development",
      "MVP launch",
      "scalable architecture",
      "structured development",
    ],
  },
  mvp: {
    title: "MVP Launch Program - Product Design & Development",
    description:
      "Launch your product faster with structured MVP program. End-to-end design, scalable architecture, and fast delivery for startup founders.",
    keywords: [
      "MVP development",
      "product launch",
      "startup MVP",
      "product design",
      "architecture design",
    ],
  },
  execution: {
    title: "Execution Sprints - Rapid Product Development Cycles",
    description:
      "Accelerate product development with focused execution sprints. Continuous iteration, structured workflows, and rapid delivery for growing teams.",
    keywords: [
      "execution sprints",
      "product development",
      "development cycles",
      "rapid delivery",
      "agile development",
    ],
  },
  about: {
    title: "About Xocket - Startup Execution Experts",
    description:
      "Learn about Xocket's approach to structured product execution. Discover how we partner with startups to build products the right way.",
    keywords: ["about us", "startup experts", "execution partner", "company"],
  },
  caseStudies: {
    title: "Case Studies - Product Success Stories  ",
    description:
      "Explore how Xocket helped startups achieve their product goals. Real results, real partnerships, proven methodologies.",
    keywords: [
      "case studies",
      "success stories",
      "product results",
      "client work",
    ],
  },
  contact: {
    title: "Contact Xocket - Let's Build Together",
    description:
      "Ready to take your product to the next level? Contact Xocket team to discuss your startup's execution needs.",
    keywords: ["contact", "get in touch", "book a call", "startup consulting"],
  },
  terms: {
    title: "Terms of Service - Xocket",
    description: "Read the terms of service for Xocket partner programs and services.",
    keywords: ["terms", "legal", "terms of service"],
  },
  privacy: {
    title: "Privacy Policy - Xocket",
    description: "Read Xocket's privacy policy to understand how we handle your data.",
    keywords: ["privacy", "privacy policy", "data protection"],
  },
};

export function generatePageMetadata(page: keyof typeof pageMetadata): Metadata {
  const meta = pageMetadata[page];
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: "website",
      url: `https://xocket.vercel.app${
        page === "home"
          ? ""
          : page === "caseStudies"
          ? "/case-studies"
          : page === "contact"
          ? "/contact-us"
          : `/${page}`
      }`,
      siteName: "Xocket",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "Xocket",
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: ["/og-image.png"],
    },
  };
}
