"use client";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Footer from "@/components/landing/footer";

const ContactPage = () => {
  return (
    <div>
      <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
        <div className="mx-auto max-w-[1400px] px-4 py-16 lg:py-24">
          <div className="grid grid-cols-1 w-full items-start gap-16 lg:grid-cols-[1fr_1.15fr] lg:gap-24">
            <div className="flex flex-col pt-4 lg:pt-12">
              <div className="mb-8 flex w-fit items-center gap-2 bg-[#1A1A1A] px-3 py-1.5">
                <div className="h-2 w-2 bg-white" />
                <span className="uppercase text-sm font-chivo-mono">
                  CONTACT US
                </span>
              </div>

              <h1 className="font-heading mb-6 text-5xl leading-[1.05] tracking-tight md:text-7xl lg:text-[5.5rem] text-muted-foreground">
                Let&apos;s build{" "}
                <span className="italic text-foreground">together.</span>
              </h1>

              {/* Description */}
              <p className="mb-16 max-w-[420px] text-lg text-[#999999] leading-relaxed">
                Ready to accelerate your startup execution? Fill out the form or
                book a strategy call directly.
              </p>

              {/* Contact Details */}
              <div className="flex flex-col gap-10">
                <div>
                  <h3 className="mb-3 text-[11px] font-bold tracking-[0.2em] text-white uppercase">
                    Email Us
                  </h3>
                  <a
                    href="mailto:hello@xocket.io"
                    className="text-[#999999] hover:text-white transition-colors"
                  >
                    hello@xocket.io
                  </a>
                </div>

                <div>
                  <h3 className="mb-3 text-[11px] font-bold tracking-[0.2em] text-white uppercase">
                    Office
                  </h3>
                  <p className="text-[#999999]">San Francisco, CA</p>
                </div>
              </div>
            </div>

            <div className="relative w-full">
              <div className="absolute -inset-8 z-0 opacity-40 md:-inset-12">
                <Image
                  src="/hero.svg"
                  alt="background pattern"
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              <div className="relative z-10 border border-[#222222] bg-[#0A0A0A] p-6 md:p-10 lg:p-14">
                <form
                  className="flex flex-col space-y-8"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <div className="space-y-3">
                    <label
                      htmlFor="name"
                      className="uppercase font-chivo-mono text-sm text-foreground/80"
                    >
                      Name
                    </label>
                    <Input
                      id="name"
                      placeholder="your name"
                      className="h-12 rounded-none border-[#222222] bg-transparent text-white placeholder:text-[#555555] focus-visible:border-white focus-visible:ring-0"
                    />
                  </div>

                  {/* Email Field */}
                  <div className="space-y-3">
                    <label
                      htmlFor="email"
                      className="uppercase font-chivo-mono text-sm text-foreground/80"
                    >
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="input your email adress"
                      className="h-12 rounded-none border-[#222222] bg-transparent text-white placeholder:text-[#555555] focus-visible:border-white focus-visible:ring-0"
                    />
                  </div>

                  <div className="space-y-3">
                    <label
                      htmlFor="company"
                      className="uppercase font-chivo-mono text-sm text-foreground/80"
                    >
                      Company
                    </label>
                    <Input
                      id="company"
                      placeholder="input your email adress"
                      className="h-12 rounded-none border-[#222222] bg-transparent text-white placeholder:text-[#555555] focus-visible:border-white focus-visible:ring-0"
                    />
                  </div>

                  <div className="space-y-3">
                    <label
                      htmlFor="pricing"
                      className="uppercase font-chivo-mono text-sm text-foreground/80"
                    >
                      Pricing
                    </label>
                    <Select>
                      <SelectTrigger className="h-12! w-full rounded-none border-[#222222] bg-transparent">
                        <SelectValue placeholder="select..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-none border-[#222222] bg-[#0A0A0A] text-white">
                        <SelectItem
                          value="starter"
                          className="focus:bg-[#1A1A1A] focus:text-white"
                        >
                          Starter
                        </SelectItem>
                        <SelectItem
                          value="pro"
                          className="focus:bg-[#1A1A1A] focus:text-white"
                        >
                          Pro
                        </SelectItem>
                        <SelectItem
                          value="enterprise"
                          className="focus:bg-[#1A1A1A] focus:text-white"
                        >
                          Enterprise
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <label
                      htmlFor="description"
                      className="uppercase font-chivo-mono text-sm text-foreground/80"
                    >
                      Project Description
                    </label>
                    <textarea
                      id="description"
                      placeholder="Type Your Message..."
                      className="flex min-h-[160px] w-full resize-none rounded-none border border-[#222222] bg-transparent px-3 py-3 text-sm text-white shadow-sm placeholder:text-[#555555] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:border-white disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <Button type="submit" className="h-12">
                    Submit
                    <ArrowUpRight className="ml-2 h-4 w-4 stroke-[2]" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ContactPage;
