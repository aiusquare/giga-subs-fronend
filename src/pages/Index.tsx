import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { motion } from "framer-motion";
import {
  Wifi, Smartphone, CreditCard, Zap, Shield, Clock, ChevronRight,
  Download, Users, TrendingUp, Star, Lock, Headphones, Monitor,
  RefreshCw, Wallet, History, Moon, Gift, ArrowRight, MessageCircle,
  Globe, CheckCircle2
} from "lucide-react";
import { useEffect, useState } from "react";

// Animated counter hook
function useCounter(end: number, duration = 2000, prefix = "", suffix = "") {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [started, end, duration]);

  return { count: `${prefix}${count.toLocaleString()}${suffix}`, ref: setStarted };
}

const services = [
  { icon: Wifi, title: "Data Top-Up", description: "All networks covered", color: "from-blue-500 to-cyan-400", href: "/data", serviceType: "data" },
  { icon: Smartphone, title: "Airtime Recharge", description: "Instant delivery", color: "from-emerald-500 to-green-400", href: "/airtime", serviceType: "airtime" },
  { icon: Zap, title: "Electricity Bills", description: "Prepaid & postpaid", color: "from-amber-500 to-yellow-400", href: "/electricity", serviceType: "electricity" },
  { icon: Monitor, title: "Cable TV", description: "DStv, GOtv, StarTimes", color: "from-purple-500 to-violet-400", href: "/cable", serviceType: "cable" },
  { icon: RefreshCw, title: "Airtime to Cash", description: "Convert unused airtime", color: "from-cyan-500 to-sky-400", href: "/more", serviceType: "airtime_cash" },
  { icon: Wallet, title: "Wallet Funding", description: "Bank transfer & card", color: "from-pink-500 to-rose-400", href: "/dashboard", serviceType: "wallet" },
  { icon: RefreshCw, title: "Bulk Reseller", description: "Start your VTU biz", color: "from-indigo-500 to-blue-400", href: "/dashboard", serviceType: "reseller" },
  { icon: Globe, title: "API Access", description: "Connect your platform", color: "from-slate-700 to-blue-500", href: "/api", serviceType: "api" },
];

const benefits = [
  { icon: Zap, title: "Fast Executions", description: "Automated routing helps complete data, airtime and bill payments without delay.", accent: "text-amber-400" },
  { icon: Lock, title: "Financially Secure", description: "Encrypted payments and verified transaction records you can trust.", accent: "text-emerald-400" },
  { icon: TrendingUp, title: "Competitive Pricing", description: "Affordable rates for daily buyers, agents, and growing resellers.", accent: "text-blue-400" },
  { icon: Headphones, title: "Guide & Support", description: "Reach support when you need help with orders, funding, or account setup.", accent: "text-purple-400" },
];

const appFeatures = [
  { icon: Wallet, text: "Smart Wallet System" },
  { icon: History, text: "Transaction History" },
  { icon: Gift, text: "Referral Earnings" },
  { icon: Moon, text: "Dark Mode Support" },
];

const marketplaceHighlights = [
  { icon: RefreshCw, title: "Automation", description: "Most orders move through automated checks and fulfillment so customers are not left waiting." },
  { icon: Headphones, title: "Dedicated Team", description: "Support is close by for failed orders, wallet funding, reseller setup, and general questions." },
  { icon: Clock, title: "24/7 Availability", description: "Buy data, airtime, cable and electricity tokens whenever your customers need them." },
];

const platformStats = [
  { value: "6K+", label: "Happy Clients" },
  { value: "45K+", label: "Orders Completed" },
  { value: "987+", label: "Verified Transactions" },
  { value: "24/7", label: "Service Access" },
];

const serviceSpotlights = [
  {
    icon: Smartphone,
    title: "Airtime Topup",
    description: "Recharge MTN, Airtel, Glo and 9mobile lines instantly from one wallet.",
    points: ["Instant value", "All major networks", "Clean receipts"],
    href: "/airtime",
  },
  {
    icon: Wifi,
    title: "Buy Data",
    description: "Offer low-rate data bundles for browsing, streaming, work and reseller customers.",
    points: ["Affordable bundles", "Fast delivery", "Reseller friendly"],
    href: "/data",
  },
  {
    icon: Monitor,
    title: "Cable Subscription",
    description: "Activate DStv, GOtv and StarTimes packages without long queues or manual follow-up.",
    points: ["Quick activation", "Package options", "Status tracking"],
    href: "/cable",
  },
  {
    icon: CreditCard,
    title: "Airtime to Cash",
    description: "Give users a way to convert excess airtime into useful wallet value.",
    points: ["Simple request flow", "Attractive rates", "Wallet settlement"],
    href: "/more",
  },
];

const reviews = [
  { name: "Aisha M.", role: "Business Owner", text: `${siteConfig.name} transformed how I run my recharge card business. So fast and reliable!`, rating: 5 },
  { name: "Chinedu O.", role: "Student", text: "Best data prices I've found. The app is super easy to use too.", rating: 5 },
  { name: "Fatima B.", role: "Reseller", text: `Making money with ${siteConfig.name}'s reseller program. Love the instant delivery!`, rating: 5 },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0, 0, 0.2, 1] as const },
  }),
};

const heroLine = {
  hidden: { opacity: 0, y: 36 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.12 + i * 0.12, duration: 0.65, ease: [0, 0, 0.2, 1] as const },
  }),
};

const heroBadges = [
  { icon: Wallet, label: "Wallet funded", className: "left-6 top-12", delay: 0 },
  { icon: Zap, label: "Instant topup", className: "right-8 top-24", delay: 0.6 },
  { icon: Shield, label: "Secure payment", className: "left-10 bottom-24", delay: 1.1 },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ===== HEADER ===== */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/60">
        <div className="container max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <a href="#home" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-primary-foreground lg:hidden" style={{ background: "var(--gradient-primary)" }}>
              {siteConfig.name.substring(0, 2).toUpperCase()}
            </div>
            <span className="text-2xl md:text-3xl font-extrabold tracking-wide text-primary uppercase">
              {siteConfig.name.replace(/\s+/g, "")}
            </span>
          </a>

          <nav className="hidden lg:flex items-center gap-9 text-base font-semibold text-muted-foreground">
            {[
              { label: "Home", href: "#home" },
              { label: "About", href: "#about" },
              { label: "Services", href: "#services" },
              { label: "Why Choose Us", href: "#why-choose-us" },
              { label: "Pricing", href: "#pricing" },
              { label: "Team", href: "#team" },
              { label: "Contact", href: `mailto:${siteConfig.contact.email}` },
            ].map((item) => (
              <a key={item.label} href={item.href} className="hover:text-primary transition-colors">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-base px-4">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button variant="gradient" size="lg" className="rounded-full px-6 md:px-9 shadow-xl">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section id="home" className="relative pt-24 lg:pt-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ x: [0, 24, 0], y: [0, -18, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-24 left-8 w-[420px] h-[420px] rounded-full bg-primary/8 blur-[120px]"
          />
          <motion.div
            animate={{ x: [0, -30, 0], y: [0, 22, 0], scale: [1, 1.12, 1] }}
            transition={{ duration: 13, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
            className="absolute right-0 top-20 w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[120px]"
          />
        </div>

        <div className="container max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-[0.95fr_1.05fr] items-stretch min-h-[calc(100vh-5rem)]">
            <div className="py-14 md:py-20 lg:py-24 flex flex-col justify-center">
              <motion.h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-[1.15] tracking-tight text-foreground mb-7">
                {["Fast, Reliable VTU", "Services in"].map((line, i) => (
                  <motion.span
                    key={line}
                    initial="hidden"
                    animate="visible"
                    variants={heroLine}
                    custom={i}
                    className="block"
                  >
                    {line} {i === 1 && <span className="text-primary">Nigeria</span>}
                  </motion.span>
                ))}
              </motion.h1>

              <motion.p
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={1}
                className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl mb-10"
              >
                Buy Airtime, Data, Pay Electricity Bills, Subscribe to Cable TV, and purchase
                Education e-Pins instantly, all from one secure platform.
              </motion.p>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={2}
                className="flex flex-col sm:flex-row gap-5 mb-14"
              >
                <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
                <Link to="/auth">
                  <Button variant="gradient" size="xl" className="gap-3 rounded-full min-w-[210px]">
                    Get Started
                    <motion.span animate={{ x: [0, 5, 0] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}>
                      <ArrowRight className="w-5 h-5" />
                    </motion.span>
                  </Button>
                </Link>
                </motion.div>
                <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
                <Link to="/auth">
                  <Button variant="outline" size="xl" className="gap-3 rounded-full min-w-[185px] border-2 border-primary text-primary hover:text-primary">
                    Login
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </Link>
                </motion.div>
              </motion.div>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={3}
                className="border-t border-border/70 pt-8 grid grid-cols-3 gap-5 max-w-2xl"
              >
                {[
                  { icon: Users, value: "10,000+", label: "Happy Users" },
                  { icon: Shield, value: "100%", label: "Secure Payments" },
                  { icon: Zap, value: "24/7", label: "Instant Access" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.75 + i * 0.12, duration: 0.45 }}
                    whileHover={{ y: -4 }}
                  >
                    <stat.icon className="w-7 h-7 text-emerald-500 mb-3" />
                    <p className="text-2xl md:text-3xl font-extrabold text-primary">{stat.value}</p>
                    <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25, duration: 0.7, ease: [0, 0, 0.2, 1] }}
              className="relative min-h-[420px] lg:min-h-0 -mx-4 lg:mx-0"
            >
              <motion.img
                src="/brands/gigadata/hero-vtu-dashboard.png"
                alt="Floating mobile dashboard for secure VTU payments"
                animate={{ y: [0, -16, 0], scale: [1, 1.025, 1] }}
                transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/15 to-transparent lg:hidden" />
              {heroBadges.map((badge) => (
                <motion.div
                  key={badge.label}
                  initial={{ opacity: 0, y: 18, scale: 0.92 }}
                  animate={{ opacity: 1, y: [0, -10, 0], scale: 1 }}
                  transition={{
                    opacity: { delay: 0.7 + badge.delay, duration: 0.4 },
                    scale: { delay: 0.7 + badge.delay, duration: 0.4 },
                    y: { delay: 1 + badge.delay, duration: 4.5, repeat: Infinity, ease: "easeInOut" },
                  }}
                  className={`absolute hidden md:flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-semibold text-foreground shadow-xl backdrop-blur-md ${badge.className}`}
                >
                  <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <badge.icon className="w-4 h-4" />
                  </span>
                  {badge.label}
                </motion.div>
              ))}
              <motion.a
                href={`https://wa.me/${siteConfig.contact.whatsapp.replace(/\D/g, "")}`}
                initial={{ opacity: 0, scale: 0.75 }}
                animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
                transition={{
                  opacity: { delay: 1.1, duration: 0.35 },
                  scale: { delay: 1.1, duration: 0.35 },
                  y: { delay: 1.5, duration: 3, repeat: Infinity, ease: "easeInOut" },
                }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                className="absolute right-6 bottom-6 w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/30"
                aria-label="Chat with us on WhatsApp"
              >
                <MessageCircle className="w-8 h-8" />
              </motion.a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== MARKETPLACE SNAPSHOT ===== */}
      <section id="about" className="py-16 md:py-24 border-y border-border/40 bg-secondary/20">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-10 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeUp}
            >
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary mb-4">
                <CheckCircle2 className="w-4 h-4" />
                No. 1 energy for everyday VTU
              </span>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-5">
                A faster marketplace for <span className="gradient-text">digital essentials.</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                Inspired by the best VTU platforms, {siteConfig.name} brings data, airtime, cable subscription,
                electricity bills and reseller tools into a simple automated experience.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/auth">
                  <Button variant="gradient" className="gap-2">
                    Register Now
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
                <a href={`mailto:${siteConfig.contact.email}`}>
                  <Button variant="outline" className="gap-2 border-border/60">
                    Talk to Support
                    <Headphones className="w-4 h-4" />
                  </Button>
                </a>
              </div>
            </motion.div>

            <div className="space-y-6">
              <div className="grid sm:grid-cols-3 gap-4">
                {marketplaceHighlights.map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    custom={i}
                    className="glass-card p-5"
                  >
                    <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={3}
                className="grid grid-cols-2 md:grid-cols-4 gap-3"
              >
                {platformStats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-border/50 bg-background/70 p-4 text-center">
                    <p className="text-2xl font-extrabold gradient-text">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SERVICES GRID ===== */}
      <section id="services" className="py-20 md:py-28 relative">
        <div className="container max-w-7xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Everything You Need, <span className="gradient-text">In One App</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              All your digital payment services in a single, beautiful interface.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {services.map((service, i) => (
              <Link to={service.href} key={service.title}>
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i}
                  whileHover={{ scale: 1.03, y: -4 }}
                  className="group glass-card p-6 md:p-8 cursor-pointer transition-all duration-300 hover:border-primary/30"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-5 shadow-lg group-hover:shadow-xl transition-shadow`}>
                    <service.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">{service.title}</h3>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SERVICE SPOTLIGHTS ===== */}
      <section className="pb-20 md:pb-28">
        <div className="container max-w-7xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Services That Keep <span className="gradient-text">Customers Moving</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From quick top-ups to reseller-ready utilities, each flow is built around clear status,
              instant receipts and dependable fulfillment.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {serviceSpotlights.map((service, i) => (
              <motion.div
                key={service.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="glass-card p-6 flex flex-col"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 text-primary" style={{ background: "hsl(var(--primary) / 0.1)" }}>
                  <service.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{service.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">{service.description}</p>
                <div className="space-y-2 mb-6">
                  {service.points.map((point) => (
                    <div key={point} className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
                <Link to={service.href} className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-primary hover:gap-3 transition-all">
                  Explore service
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WHY CHOOSE US ===== */}
      <section id="why-choose-us" className="py-20 md:py-28 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-0 w-[500px] h-[500px] rounded-full bg-blue-600/5 blur-[120px]" />
        </div>
        <div className="container max-w-7xl mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Built for Speed. <span className="gradient-text">Designed for Trust.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="glass-card p-6 text-center group"
              >
                <motion.div
                  whileHover={{ rotate: 10 }}
                  className={`w-16 h-16 rounded-2xl bg-secondary/80 flex items-center justify-center mx-auto mb-5 ${b.accent}`}
                >
                  <b.icon className="w-8 h-8" />
                </motion.div>
                <h3 className="text-lg font-bold text-foreground mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== APP PREVIEW ===== */}
      <section className="py-20 md:py-28">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Phone Mockup */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="relative flex justify-center"
            >
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                <div className="w-[260px] h-[520px] md:w-[300px] md:h-[600px] rounded-[3rem] border-4 border-border/50 bg-card overflow-hidden shadow-2xl shadow-primary/10">
                  {/* Phone screen content */}
                  <div className="p-5 pt-10 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-xs text-muted-foreground">Welcome back</p>
                        <p className="text-sm font-bold text-foreground">Rawayau User</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                    {/* Balance card in phone */}
                    <div className="rounded-2xl p-4 mb-4 text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
                      <p className="text-[10px] opacity-80">Wallet Balance</p>
                      <p className="text-2xl font-bold">₦25,430.00</p>
                    </div>
                    {/* Mini service grid */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {[Wifi, Smartphone, Zap, Monitor].map((Icon, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-secondary/60">
                          <Icon className="w-4 h-4 text-primary" />
                          <span className="text-[8px] text-muted-foreground">
                            {["Data", "Airtime", "Power", "Cable"][idx]}
                          </span>
                        </div>
                      ))}
                    </div>
                    {/* Recent transactions */}
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-foreground mb-2">Recent</p>
                      {["MTN 2GB Data", "Airtel ₦500", "IKEDC Token"].map((tx, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2 border-b border-border/30">
                          <span className="text-[10px] text-foreground">{tx}</span>
                          <span className="text-[10px] text-emerald-400">✓ Done</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Glow behind phone */}
                <div className="absolute -inset-8 bg-primary/10 blur-3xl rounded-full -z-10" />
              </motion.div>
            </motion.div>

            {/* Feature list */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={1}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Your Finances, <span className="gradient-text">At Your Fingertips</span>
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                A beautifully designed app that makes managing your digital transactions effortless,
                with automation, receipts, support and reseller tools built in.
              </p>
              <div className="space-y-5">
                {appFeatures.map((f, i) => (
                  <motion.div
                    key={f.text}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    custom={i + 2}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/30 border border-border/30 hover:border-primary/30 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
                      <f.icon className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <span className="text-foreground font-medium">{f.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== SOCIAL PROOF ===== */}
      <section id="team" className="py-20 md:py-28 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-[120px]" />
        </div>
        <div className="container max-w-7xl mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Trusted by <span className="gradient-text">Thousands</span>
            </h2>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {[
              { value: "45K+", label: "Orders Completed" },
              { value: "6K+", label: "Happy Clients" },
              { value: "90%", label: "Automated Flow" },
              { value: "24/7", label: "Support Access" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="glass-card p-6 text-center"
              >
                <p className="text-2xl md:text-3xl font-extrabold gradient-text mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Reviews */}
          <div className="grid md:grid-cols-3 gap-6">
            {reviews.map((review, i) => (
              <motion.div
                key={review.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="glass-card p-6"
              >
                <div className="flex gap-1 mb-3">
                  {[...Array(review.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-foreground mb-4 leading-relaxed">"{review.text}"</p>
                <div>
                  <p className="text-sm font-bold text-foreground">{review.name}</p>
                  <p className="text-xs text-muted-foreground">{review.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== REFERRAL & EARNINGS ===== */}
      <section id="pricing" className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, hsl(174 72% 50% / 0.08) 0%, hsl(199 89% 48% / 0.08) 100%)" }} />
        <div className="container max-w-7xl mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Earn While You <span className="gradient-text">Recharge</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-12">
              Turn your everyday transactions into a revenue stream.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Gift, title: "Referral Bonus", description: "Earn ₦200 for every friend you refer. No limits on how much you can earn." },
              { icon: TrendingUp, title: "Reseller Discounts", description: "Get wholesale prices on all services. Higher volumes mean bigger margins." },
              { icon: Wallet, title: "Commission System", description: "Earn commissions on every transaction from your downline network." },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="glass-card-elevated p-6 text-center"
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "var(--gradient-primary)" }}>
                  <item.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECURITY & COMPLIANCE ===== */}
      <section className="py-20 md:py-28">
        <div className="container max-w-7xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Your Security, <span className="gradient-text">Our Priority</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Shield, title: "Secure Gateway", description: "All payments processed through verified, encrypted channels." },
              { icon: Lock, title: "Data Encryption", description: "End-to-end encryption on every transaction and personal data." },
              { icon: Headphones, title: "Fast Support", description: "Our support team is available 24/7 to help resolve any issues." },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="flex flex-col items-center text-center p-6"
              >
                <div className="w-14 h-14 rounded-full bg-secondary/80 border border-border/50 flex items-center justify-center mb-4 text-primary">
                  <item.icon className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-20 md:py-28">
        <div className="container max-w-7xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            className="glass-card-elevated relative overflow-hidden p-10 md:p-16 text-center"
          >
            <div className="absolute inset-0 opacity-30" style={{ background: "var(--gradient-primary)" }} />
            <div className="absolute inset-0 bg-card/80" />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4">
                Ready to Power Up?
              </h2>
              <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
                Join thousands of Nigerians who trust {siteConfig.name} for fast, secure digital transactions every day.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/auth">
                  <Button variant="gradient" size="xl" className="gap-2 min-w-[220px]">
                    Create Free Account
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Button variant="outline" size="xl" className="gap-2 min-w-[220px] border-border/60">
                  <Download className="w-5 h-5" />
                  Download on Play Store
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-border/50 py-10">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
                  {siteConfig.name.substring(0, 2).toUpperCase()}
                </div>
                <span className="font-bold text-foreground">{siteConfig.name}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {siteConfig.description}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Quick Links</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <Link to="/auth" className="block hover:text-primary transition-colors">Sign Up</Link>
                <Link to="/auth" className="block hover:text-primary transition-colors">Login</Link>
                <a href="#" className="block hover:text-primary transition-colors">FAQ</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Contact</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>{siteConfig.contact.email}</p>
                <p>{siteConfig.business.location}</p>
              </div>
            </div>
          </div>
          <div className="border-t border-border/30 pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {siteConfig.footer.copyright}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
