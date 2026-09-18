import "@/modules/landing/styles/landing.css";
import { Chatbot } from "@/modules/landing/components/Chatbot";
import { SEO_COPY, SITE_NAME, SITE_URL } from "@/config/seo";

/**
 * Structured data for the one public page. `SoftwareApplication` is what the
 * product is; `Organization` carries the contact route and logo the search
 * engines show in the knowledge panel; `WebSite` names the site.
 */
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/logoLight.png`,
      email: "support@workflownets.com",
      address: { "@type": "PostalAddress", addressLocality: "Gaza", addressCountry: "PS" },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      inLanguage: ["en", "ar"],
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      url: SITE_URL,
      description: SEO_COPY.en.description,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: [
        { "@type": "Offer", name: "Free Plan", price: "0", priceCurrency: "USD" },
        { "@type": "Offer", name: "Pro Plan", price: "20", priceCurrency: "USD", billingIncrement: "P1M" },
        { "@type": "Offer", name: "Enterprise Plan", price: "200", priceCurrency: "USD", billingIncrement: "P1Y" },
      ],
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {children}
      <Chatbot />
    </>
  );
}
