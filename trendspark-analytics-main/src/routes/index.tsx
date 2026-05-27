import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, TrendingUp, Search, Bell, Bookmark, BarChart3, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Helix Analytics — Observe the galaxy of human knowledge" },
      { name: "description", content: "Track trending scientific research, citations, authors, and emerging keywords across Scopus, CrossRef, and IEEE Xplore." },
    ],
  }),
});

const tickerItems = [
  ["Quantum Cryptography", "+24.5%"],
  ["Neural Radiance Fields", "+42.1%"],
  ["CRISPR-LNP Delivery", "+18.4%"],
  ["Solid-State Batteries", "+15.8%"],
  ["Edge AI Inference", "+22.7%"],
  ["Synthetic Genomics", "+17.3%"],
];

const features = [
  { icon: TrendingUp, title: "Trend Analytics", body: "Detect emerging research before it reaches the horizon." },
  { icon: Search, title: "Smart Search", body: "Filter across journals, authors, citations, impact factor & trend score." },
  { icon: Bookmark, title: "Collections", body: "Bookmark papers, follow authors, keywords and journals." },
  { icon: Bell, title: "Signal Alerts", body: "Gmail-style notifications when followed signals move." },
  { icon: BarChart3, title: "Live Dashboards", body: "Line, area, pie, radar, and heatmap visualizations." },
  { icon: ShieldCheck, title: "Verified Sources", body: "Synced from Scopus, CrossRef, and IEEE Xplore with DOI dedup." },
];

function Index() {
  return (
    <div className="min-h-screen text-foreground">
      {/* Ticker */}
      <div className="h-9 border-b border-border glass flex items-center overflow-hidden">
        <div className="flex gap-12 px-6 whitespace-nowrap animate-[marquee_40s_linear_infinite]">
          {[...tickerItems, ...tickerItems].map((t, i) => (
            <div key={i} className="flex items-center gap-2 text-[10px] tracking-wider uppercase font-medium">
              <span className="text-brand">●</span>
              <span className="text-muted-foreground">{t[0]}:</span>
              <span className="text-foreground font-mono">{t[1]}</span>
            </div>
          ))}
        </div>
        <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
      </div>

      {/* Nav */}
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="size-8 rounded-lg flex items-center justify-center glow-brand" style={{ background: "var(--gradient-brand)" }}>
            <Sparkles className="size-4 text-brand-foreground" />
          </div>
          <span className="font-bold uppercase tracking-tight">Helix Analytics</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/login" className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Sign in</Link>
          <Link to="/register" className="px-4 py-2 rounded-lg text-sm font-medium text-brand-foreground glow-brand transition-transform hover:scale-[1.02]" style={{ background: "var(--gradient-brand)" }}>
            Create account
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-6 pt-24 pb-32">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
          <span className="inline-flex items-center gap-2 py-1.5 px-3 rounded-full bg-brand/10 border border-brand/30 text-brand text-[11px] font-semibold tracking-widest uppercase mb-6">
            <span className="size-1.5 rounded-full bg-brand animate-pulse" /> Intelligent Synthesis v4.0
          </span>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-8">
            Observe the galaxy of <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-brand)" }}>human knowledge</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mb-10 leading-relaxed">
            A precision instrument for tracking the trajectory of scientific thought. Map citations, quantify impact, and detect emerging constellations of research across Scopus, CrossRef, and IEEE Xplore.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/register" className="inline-flex items-center gap-2 h-12 px-6 rounded-lg font-semibold text-sm text-brand-foreground glow-brand transition-transform hover:scale-[1.02]" style={{ background: "var(--gradient-brand)" }}>
              Enter the Observatory <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl">
            {[
              ["4,203", "Indexed journals"],
              ["42.8M", "Citations tracked"],
              ["99.9%", "Sync uptime"],
            ].map(([v, l]) => (
              <div key={l}>
                <div className="text-3xl font-bold font-mono">{v}</div>
                <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{l}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Decorative glow */}
        <div className="absolute -top-20 right-0 size-[600px] rounded-full opacity-30 blur-3xl pointer-events-none" style={{ background: "var(--gradient-brand)" }} />
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="glass rounded-2xl p-6 hover:border-brand/40 transition-colors"
            >
              <div className="size-10 rounded-lg bg-brand/10 border border-brand/30 flex items-center justify-center mb-4">
                <f.icon className="size-5 text-brand" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <div>© 2024 Helix Analytics. Simulated data for demonstration.</div>
          <div className="font-mono">SCOPUS · CROSSREF · IEEE XPLORE</div>
        </div>
      </footer>
    </div>
  );
}
