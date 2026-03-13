"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="py-20">
      <motion.div
        className="mx-auto max-w-2xl text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl font-light tracking-tight">
          Ready to see your company&apos;s{" "}
          <span className="font-semibold text-primary">growth potential</span>?
        </h2>
        <p className="mt-4 text-muted-foreground">
          Upload your company documents and get AI-powered hiring
          recommendations in minutes.
        </p>
        <Link href="/upload" className="mt-8 inline-block">
          <Button size="lg" className="gap-2 rounded-full px-6">
            Upload Documents
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </motion.div>
    </section>
  );
}
