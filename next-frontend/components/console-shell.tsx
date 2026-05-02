"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Badge } from "./ui/badge";

const FlexApp = dynamic(() => import("./console-runtime"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[60vh] items-center justify-center text-sky-100">
      <p className="text-sm tracking-wide">Loading Flex Console...</p>
    </div>
  ),
});

export default function ConsoleShell() {
  const reduceMotion = useReducedMotion();

  return (
    <main className="auth-aura relative min-h-screen overflow-x-hidden text-white">
      <motion.div
        className="pointer-events-none absolute left-0 top-0 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl"
        animate={reduceMotion ? undefined : { x: [0, 24, 0], y: [0, 14, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-indigo-300/20 blur-3xl"
        animate={reduceMotion ? undefined : { x: [0, -22, 0], y: [0, -16, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="sticky top-0 z-20 border-b border-white/15 bg-slate-950/45 backdrop-blur-xl"
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-200/90">Flex 2.0</p>
            <p className="text-sm text-sky-100/90">Next.js Console Runtime</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Badge className="border-cyan-200/50 bg-cyan-100/10 text-cyan-100">Realtime Demo</Badge>
            <Link href="/" className="rounded-lg border border-white/30 px-3 py-1.5 hover:bg-white/10">
              Home
            </Link>
            <Link href="/credentials" className="rounded-lg border border-cyan-300/30 px-3 py-1.5 hover:bg-cyan-100/10">
              Credentials
            </Link>
          </div>
        </div>
      </motion.header>

      <motion.div
        className="relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <FlexApp />
      </motion.div>
    </main>
  );
}