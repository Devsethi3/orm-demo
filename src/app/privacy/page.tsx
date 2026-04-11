import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { generatePageMetadata } from "@/lib/metadata";

export const metadata: Metadata = generatePageMetadata("privacy");

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-chivo-mono">
      <div className="fixed top-0 left-0 right-0 z-50 bg-background backdrop-blur border-b border-border py-6 px-6 lg:px-12">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="size-4" />
          Back to home
        </Link>
      </div>

      <div className="py-16 px-6 lg:px-12">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-heading mb-12 text-foreground">
            Privacy Policy
          </h1>

          <div className="space-y-7">
            <section>
              <h2 className="text-lg uppercase text-muted-foreground">
                Introduction
              </h2>
              <p>
                We at Xocket (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;, or &quot;Company&quot;) are committed to protecting your privacy. This Privacy Policy explains our practices 
                regarding the collection, use, disclosure, and protection of your information when you use our website and services.
              </p>
            </section>

            <section>
              <h2 className="text-lg uppercase text-muted-foreground">
                Information We Collect
              </h2>
              <p className="mb-4">We may collect the following types of information:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>
                  <strong>Personal Information:</strong> Name, email address, phone number, company information, and other details you provide directly
                </li>
                <li>
                  <strong>Usage Information:</strong> Information about how you interact with our website, including pages visited, time spent, and actions taken
                </li>
                <li>
                  <strong>Technical Information:</strong> IP address, browser type, operating system, and other technical details about your device
                </li>
                <li>
                  <strong>Cookies and Tracking:</strong> We use cookies and similar technologies to enhance your experience
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg uppercase text-muted-foreground">
                How We Use Your Information
              </h2>
              <p className="mb-4">We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Respond to your inquiries and requests</li>
                <li>Send you promotional materials and updates (with your consent)</li>
                <li>Analyze usage patterns and improve user experience</li>
                <li>Comply with legal obligations</li>
                <li>Prevent fraudulent or unauthorized activities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg uppercase text-muted-foreground">
                Information Sharing
              </h2>
              <p>
                We do not sell, trade, or rent your personal information to third parties. However, we may share information with:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2 mt-4">
                <li>Service providers who assist us in operating our website and conducting business</li>
                <li>Legal authorities when required by law</li>
                <li>Business partners with your explicit consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg uppercase text-muted-foreground">
                Data Security
              </h2>
              <p>
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, 
                alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee 
                absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-lg uppercase text-muted-foreground">
                Your Rights
              </h2>
              <p className="mb-4">Depending on your location, you may have the following rights:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Access to your personal information</li>
                <li>Right to correct inaccurate information</li>
                <li>Right to request deletion of your information</li>
                <li>Right to opt-out of marketing communications</li>
                <li>Right to data portability</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg uppercase text-muted-foreground">
                Cookies and Tracking Technologies
              </h2>
              <p>
                We use cookies to enhance your experience on our website. You can control cookie settings through your browser preferences. 
                However, disabling cookies may affect the functionality of our website.
              </p>
            </section>

            <section>
              <h2 className="text-lg uppercase text-muted-foreground">
                Third-Party Links
              </h2>
              <p>
                Our website may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. 
                We encourage you to review their privacy policies before providing any information.
              </p>
            </section>

            <section>
              <h2 className="text-lg uppercase text-muted-foreground">
                Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on 
                this page and updating the &quot;Last Updated&quot; date. Your continued use of our website constitutes your acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-lg uppercase text-muted-foreground">
                Children&apos;s Privacy
              </h2>
              <p>
                Our services are not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. 
                If we become aware that a child has provided us with personal information, we will promptly delete such information.
              </p>
            </section>

            <section className="mt-16 pt-12 border-t border-border">
              <h2 className="text-lg uppercase text-muted-foreground">
                Contact Us
              </h2>
              <p>
                If you have any questions about this Privacy Policy or our privacy
                practices, please contact us at{" "}
                <a
                  href="mailto:xocket@gmail.com"
                  className="text-foreground underline hover:opacity-80 transition-opacity"
                >
                  xocket@gmail.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
