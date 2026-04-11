import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { generatePageMetadata } from "@/lib/metadata";

export const metadata: Metadata = generatePageMetadata("terms");

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-chivo-mono">
      <div className="fixed top-0 left-0 right-0 z-50 bg-background backdrop-blur border-b border-border py-6 px-6 lg:px-12">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="size-4" />
          <span>Back to home</span>
        </Link>
      </div>

      <div className="py-16 px-6 lg:px-12">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-heading mb-12 text-foreground">
            Terms of Service
          </h1>

          <div className="space-y-7">
            <section>
              <h2 className="text-lg uppercase text-muted-foreground">
                Agreement to Terms
              </h2>
              <p>
                By accessing and using this website, you accept and agree to be
                bound by the terms and provision of this agreement. If you do
                not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-lg uppercase text-muted-foreground">
                Use License
              </h2>
              <p className="mb-4">
                Permission is granted to temporarily download one copy of the
                materials (information or software) on Xocket&apos;s website for
                personal, non-commercial transitory viewing only. This is the
                grant of a license, not a transfer of title, and under this
                license you may not:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Modifying or copying the materials</li>
                <li>
                  Using the materials for any commercial purpose or for any
                  public display
                </li>
                <li>
                  Attempting to decompile or reverse engineer any software
                  contained on the website
                </li>
                <li>
                  Removing any copyright or other proprietary notations from the
                  materials
                </li>
                <li>
                  Transferring the materials to another person or &quot;mirroring&quot;
                  the materials on any other server
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg uppercase text-muted-foreground">
                Disclaimer
              </h2>
              <p>
                The materials on Xocket&apos;s website are provided on an &quot;as is&quot;
                basis. Xocket makes no warranties, expressed or implied, and
                hereby disclaims and negates all other warranties including,
                without limitation, implied warranties or conditions of
                merchantability, fitness for a particular purpose, or
                non-infringement of intellectual property or other violation of
                rights.
              </p>
            </section>

            <section>
              <h2 className="text-lg uppercase text-muted-foreground">
                Limitations
              </h2>
              <p>
                In no event shall Xocket or its suppliers be liable for any
                damages (including, without limitation, damages for loss of data
                or profit, or due to business interruption) arising out of the
                use or inability to use the materials on Xocket&apos;s website, even
                if Xocket or an authorized representative has been notified
                orally or in writing of the possibility of such damage.
              </p>
            </section>

            <section>
              <h2 className="text-lg uppercase text-muted-foreground">
                Accuracy of Materials
              </h2>
              <p>
                The materials appearing on Xocket&apos;s website could include
                technical, typographical, or photographic errors. Xocket does
                not warrant that any of the materials on the website are
                accurate, complete, or current. Xocket may make changes to the
                materials contained on its website at any time without notice.
              </p>
            </section>

            <section>
              <h2 className="text-lg uppercase text-muted-foreground">Links</h2>
              <p>
                Xocket has not reviewed all of the sites linked to its website
                and is not responsible for the contents of any such linked site.
                The inclusion of any link does not imply endorsement by Xocket
                of the site. Use of any such linked website is at the user&apos;s own
                risk.
              </p>
            </section>

            <section>
              <h2 className="text-lg uppercase text-muted-foreground">
                Modifications
              </h2>
              <p>
                Xocket may revise these terms of service for its website at any
                time without notice. By using this website, you are agreeing to
                be bound by the then current version of these terms of service.
              </p>
            </section>

            <section>
              <h2 className="text-lg uppercase text-muted-foreground">
                Governing Law
              </h2>
              <p>
                These terms and conditions are governed by and construed in
                accordance with the laws of the jurisdiction in which Xocket
                operates, and you irrevocably submit to the exclusive
                jurisdiction of the courts in that location.
              </p>
            </section>

            <section className="mt-16 pt-12 border-t border-border">
              <h2 className="text-lg uppercase text-muted-foreground">
                Questions?
              </h2>
              <p>
                If you have any questions about these Terms of Service, please
                contact us at{" "}
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
