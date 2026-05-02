"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "./ui/button";

const capabilityRows = [
  ["Identity and admission core", "Every record is campus-partitioned and role-aware from day one."],
  ["Academic command pipeline", "Registration, assessment, attendance, and grading run in one model."],
  ["Operational workflow mesh", "Maintenance and extra-class approvals stay auditable and traceable."],
  ["Transcript automation", "Semester finalization computes SGPA and CGPA with controlled rules."],
];

export default function LandingShell() {
  const reduceMotion = useReducedMotion();

  return (
    <main className="auth-aura relative min-h-screen overflow-hidden text-white">
      <motion.div
        className="pointer-events-none absolute -left-24 top-20 h-[30rem] w-[30rem] rounded-full bg-cyan-300/20 blur-3xl"
        animate={reduceMotion ? undefined : { x: [0, 30, 0], y: [0, 16, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -bottom-24 right-0 h-[34rem] w-[34rem] rounded-full bg-indigo-400/25 blur-3xl"
        animate={reduceMotion ? undefined : { x: [0, -24, 0], y: [0, -10, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      <section className="relative min-h-screen overflow-hidden">
        <Image
          src="/images/university-hero.jpg"
          alt="University campus"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/74 via-slate-950/36 to-slate-950/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-end px-6 pb-16 pt-24 lg:px-10">
          <div className="max-w-4xl space-y-7">
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100/90"
            >
              Flex 2.0 University Operating System
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="text-5xl font-semibold tracking-tight text-white md:text-7xl"
            >
              Flex 2.0
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="max-w-2xl text-lg leading-relaxed text-sky-100/95"
            >
              A modern command layer for admission, academics, grading, transcript finalization, and operational workflows across every campus role.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.16 }}
              className="flex flex-wrap gap-3"
            >
              <Link href="/console">
                <Button className="px-5 py-3">Launch Flex Console</Button>
              </Link>
              <Link href="/credentials">
                <Button variant="ghost" className="px-5 py-3">Open Seed Credentials</Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-7xl px-6 py-16 lg:px-10">
        <div className="space-y-4 border-b border-white/15 pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/85">Platform Scope</p>
          <h2 className="text-3xl font-semibold tracking-tight text-white">Built for production-ready university operations</h2>
        </div>
        <div className="mt-8 divide-y divide-white/10">
          {capabilityRows.map((row, index) => (
            <motion.div
              key={row[0]}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              className="grid gap-3 py-5 md:grid-cols-[280px_1fr]"
            >
              <p className="text-base font-medium text-cyan-100">{row[0]}</p>
              <p className="text-sky-100/88">{row[1]}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}