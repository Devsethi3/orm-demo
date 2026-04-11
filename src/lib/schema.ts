/**
 * JSON-LD Schema Generation Utilities
 * Used for structured data to improve SEO and rich snippets
 */

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Xocket",
  url: "https://xocket.vercel.app",
  logo: "https://xocket.vercel.app/logo.svg",
  description:
    "Partner with Xocket for structured product execution and scaling. Design, build, and launch production-ready products with proven methodologies and support.",
  image: "https://xocket.vercel.app/og-image.png",
  sameAs: [
    "https://twitter.com/xocket",
    "https://linkedin.com/company/xocket",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "Customer Service",
    url: "https://xocket.vercel.app/contact-us",
  },
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  url: "https://xocket.vercel.app",
  name: "Xocket",
  description:
    "Structured startup execution partner for product development and scaling",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate:
        "https://xocket.vercel.app/search?q={search_term_string}",
    },
    query_input: "required name=search_term_string",
  },
};

export const breadcrumbSchema = (items: { name: string; url: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});

export const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Xocket Product Execution Services",
  provider: {
    "@type": "Organization",
    name: "Xocket",
    url: "https://xocket.vercel.app",
  },
  description:
    "Comprehensive product development and execution services for startups",
  areaServed: "Worldwide",
  contactType: "Customer Service",
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Xocket Services",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "MVP Launch Program",
          description:
            "End-to-end product design and build for startup founders",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Execution Sprints",
          description:
            "Focused development cycles for teams moving faster",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Product Scaling",
          description: "Performance improvements and feature expansion",
        },
      },
    ],
  },
};

/**
 * Helper to generate schema script for head
 */
export function generateSchemaScript(schema: Record<string, unknown>): string {
  return JSON.stringify(schema);
}
