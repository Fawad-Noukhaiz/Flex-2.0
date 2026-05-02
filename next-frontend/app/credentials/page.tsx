"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Panel } from "../../components/ui/panel";

const campusGroups = [
  { campus: "Islamabad", admin: "ADM-ISB-01", sec: "SEC-ISL-01", mnt: ["MNT-ISL-01", "MNT-ISL-02"], tea: "TEA-ISL-001 ... TEA-ISL-004", std: "STD-ISL-001 ... STD-ISL-012" },
  { campus: "Lahore", admin: "ADM-LHR-01", sec: "SEC-LAH-01", mnt: ["MNT-LAH-01", "MNT-LAH-02"], tea: "TEA-LAH-001 ... TEA-LAH-004", std: "STD-LAH-001 ... STD-LAH-012" },
  { campus: "Karachi", admin: "ADM-KHI-01", sec: "SEC-KAR-01", mnt: ["MNT-KAR-01", "MNT-KAR-02"], tea: "TEA-KAR-001 ... TEA-KAR-004", std: "STD-KAR-001 ... STD-KAR-012" },
  { campus: "CFD", admin: "ADM-CFD-01", sec: "SEC-CFD-01", mnt: ["MNT-CFD-01", "MNT-CFD-02"], tea: "TEA-CFD-001 ... TEA-CFD-004", std: "STD-CFD-001 ... STD-CFD-012" },
  { campus: "Multan", admin: "ADM-MUL-01", sec: "SEC-MUL-01", mnt: ["MNT-MUL-01", "MNT-MUL-02"], tea: "TEA-MUL-001 ... TEA-MUL-004", std: "STD-MUL-001 ... STD-MUL-012" },
  { campus: "Peshawar", admin: "ADM-PSH-01", sec: "SEC-PES-01", mnt: ["MNT-PES-01", "MNT-PES-02"], tea: "TEA-PES-001 ... TEA-PES-004", std: "STD-PES-001 ... STD-PES-012" },
];

export default function CredentialsPage() {
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState<string>("");
  const filtered = useMemo(
    () => campusGroups.filter((group) => group.campus.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  const copyRoll = async (campus: string, roll: string) => {
    await navigator.clipboard.writeText(roll);
    setCopied(`${campus}-${roll}`);
    setTimeout(() => setCopied(""), 1200);
  };

  return (
    <main className="auth-aura min-h-screen px-6 py-10 text-white lg:px-10">
      <section className="mx-auto max-w-5xl space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/90">Flex 2.0 Access Directory</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Seed Credentials</h1>
          <p className="text-sm text-sky-100/90">Default password for all seeded users: <span className="font-semibold">pass123</span></p>
        </div>
        <Panel
          title="Campus Filter"
          subtitle="Find seeded roll numbers quickly by campus."
          className="border-white/20 bg-slate-950/35 text-white"
          titleClassName="text-white"
          subtitleClassName="text-sky-100/80"
        >
          <div className="flex items-center gap-3">
            <Input
              placeholder="Type campus name (e.g. Lahore)"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="border-white/20 bg-white/10 text-white placeholder:text-slate-300"
            />
            <Badge className="border-cyan-200/40 bg-cyan-200/10 text-cyan-100">{filtered.length} campus entries</Badge>
          </div>
        </Panel>
        <div className="space-y-3">
          {filtered.map((group, idx) => (
            <motion.section
              key={group.campus}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.25 }}
              className="rounded-2xl border border-white/20 bg-slate-950/40 p-4 backdrop-blur"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-lg font-semibold text-white">{group.campus}</p>
                <Badge className="border-cyan-200/40 bg-cyan-300/10 text-cyan-100">Password: pass123</Badge>
              </div>
              <div className="grid gap-3 text-sm text-white md:grid-cols-2">
                <div className="flex items-center justify-between gap-2 rounded-xl border border-white/20 bg-white/5 px-3 py-2">
                  <p>Admin: {group.admin}</p>
                  <Button
                    onClick={() => copyRoll(group.campus, group.admin)}
                    className="px-2.5 py-1 text-xs"
                  >
                    {copied === `${group.campus}-${group.admin}` ? "Copied" : "Copy"}
                  </Button>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-xl border border-white/20 bg-white/5 px-3 py-2">
                  <p>Secretariat: {group.sec}</p>
                  <Button
                    onClick={() => copyRoll(group.campus, group.sec)}
                    className="px-2.5 py-1 text-xs"
                  >
                    {copied === `${group.campus}-${group.sec}` ? "Copied" : "Copy"}
                  </Button>
                </div>
                <p className="rounded-xl border border-white/20 bg-white/5 px-3 py-2">Maintenance: {group.mnt.join(", ")}</p>
                <p className="rounded-xl border border-white/20 bg-white/5 px-3 py-2">Teachers: {group.tea}</p>
              </div>
              <p className="mt-2 text-sm text-sky-100/90">Students: {group.std}</p>
            </motion.section>
          ))}
          {!filtered.length ? <p className="text-sm text-sky-100/90">No campus matched your search.</p> : null}
        </div>
      </section>
    </main>
  );
}