import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden border-r border-border">
        <div className="absolute inset-0 opacity-50 pointer-events-none" style={{ background: "var(--gradient-mesh)" }} />
        <Link to="/" className="flex items-center gap-3 relative">
          <img src="/logo.png?v=3" alt="Helix Analytics" className="logo-brand size-9 rounded-lg object-contain glow-brand border border-border/40 shrink-0 bg-surface-elevated p-1.5" />
          <span className="font-bold uppercase tracking-tight">Helix Analytics</span>
        </Link>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative">
          <p className="text-3xl font-bold leading-tight max-w-md">
            Observe the galaxy of human knowledge — paper by paper, citation by citation.
          </p>
          <p className="text-sm text-muted-foreground mt-4 max-w-md">
            Trusted by 14,000+ researchers across 4,203 indexed journals.
          </p>
        </motion.div>
        <div className="grid grid-cols-3 gap-6 relative">
          {[["+42.8M", "Citations"], ["1,284", "Keywords"], ["99.9%", "Uptime"]].map(([v, l]) => (
            <div key={l}>
              <div className="text-xl font-bold font-mono">{v}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <img src="/logo.png?v=3" alt="Helix Analytics" className="logo-brand size-9 rounded-lg object-contain glow-brand border border-border/40 shrink-0 bg-surface-elevated p-1.5" />
            <span className="font-bold uppercase tracking-tight">Helix Analytics</span>
          </div>
          <h1 className="text-2xl font-bold mb-2 tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground mb-8">{subtitle}</p>
          {children}
          {footer && <div className="mt-6 text-sm text-muted-foreground text-center">{footer}</div>}
        </motion.div>
      </div>
    </div>
  );
}