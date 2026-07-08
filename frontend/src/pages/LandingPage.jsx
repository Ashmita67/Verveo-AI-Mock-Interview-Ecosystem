import { motion } from "framer-motion";
import { ArrowRight, BrainCircuit, ChartColumnBig, FileCheck2, Mic, Sparkles, TimerReset } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const features = [
  {
    icon: BrainCircuit,
    title: "Adaptive AI Interviewer",
    description: "Dynamic follow-up questions that mirror real interview pressure and depth.",
  },
  {
    icon: FileCheck2,
    title: "Resume Intelligence",
    description: "Role-matched resume optimization with ATS scoring and gap detection.",
  },
  {
    icon: ChartColumnBig,
    title: "Performance Analytics",
    description: "Track consistency, confidence, and technical improvement over time.",
  },
  {
    icon: TimerReset,
    title: "Instant Feedback Loops",
    description: "Review clarity, structure, and storytelling the moment you finish.",
  },
  {
    icon: Mic,
    title: "Audio and Video Practice",
    description: "Run realistic sessions with text, voice, or camera-based answering modes.",
  },
];

function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="relative overflow-hidden py-20 sm:py-24">
        <div className="shell grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-4 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur-xl">
              <Sparkles className="h-4 w-4 text-primary" />
              Premium AI workspace for high-stakes interview prep
            </div>
            <div>
              <h1 className="max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl">
                Practice Smarter. <span className="text-primary">Interview Better.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                Verveo combines AI interview practice, resume management, scoring, and analytics into one polished ecosystem built for career momentum.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link to="/register">
                <Button size="lg">
                  Start Free Workspace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline">
                  Explore Dashboard
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-8 right-0 h-24 w-24 rounded-full bg-accent/20 blur-3xl" />
            <Card className="glass-panel overflow-hidden border-white/20 p-0 shadow-glow">
              <div className="bg-hero-grid bg-[size:24px_24px] p-6">
                <div className="rounded-[28px] bg-slate-950 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Live interview readiness</p>
                      <h3 className="mt-2 text-4xl font-semibold">Ready</h3>
                    </div>
                    <div className="rounded-2xl bg-white/10 px-4 py-3 text-right">
                      <p className="text-xs text-slate-400">Backend sync</p>
                      <p className="text-xl font-semibold text-emerald-300">Live</p>
                    </div>
                  </div>
                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    {[
                      ["Behavioral Clarity", "Adaptive follow-ups"],
                      ["System Design Depth", "Resume-aware prompts"],
                      ["Technical Accuracy", "Backend scoring"],
                      ["Leadership Signals", "Real interview reports"],
                    ].map(([item, detail]) => (
                      <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm text-slate-400">{item}</p>
                        <p className="mt-3 text-2xl font-semibold">{detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      <section id="features" className="py-20">
        <div className="shell">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Platform Capabilities</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Everything you need to turn practice into measurable progress.</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
              >
                <Card className="h-full">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20">
        <div className="shell">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">How It Works</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">A simple loop from resume upload to interview insights.</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              ["Upload Resume", "Drop a PDF resume and let Verveo parse experience, skills, and ATS signals."],
              ["Start Interview", "Choose domain, difficulty, and mode. Verveo builds a personalized question set."],
              ["Review Results", "Get scoring, feedback, analytics, and report summaries after each session."],
            ].map(([title, description], index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
              >
                <Card className="h-full">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary">
                    {index + 1}
                  </div>
                  <h3 className="mt-5 text-xl font-semibold">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="platform" className="py-20">
        <div className="shell grid gap-6 lg:grid-cols-3">
          {[
            ["Resume Management", "Store, score, and tailor every resume version for every target role."],
            ["Interview Workflows", "Design technical, behavioral, and system design sessions with reusable templates."],
            ["Insight Reporting", "Translate sessions into clear next steps with performance summaries and charts."],
          ].map(([title, description]) => (
            <Card key={title} className="bg-card/80">
              <h3 className="text-2xl font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="py-20">
        <div className="shell">
          <Card className="overflow-hidden bg-primary text-primary-foreground">
            <div className="grid gap-10 p-8 lg:grid-cols-[1fr_auto] lg:p-12">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-foreground/70">Ready to begin?</p>
                <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
                  Build momentum with structured practice, resume intelligence, and backend-synced performance data.
                </h2>
              </div>
              <div className="flex flex-col gap-3">
                <Link to="/register">
                  <Button size="lg" variant="secondary" className="w-full">
                    Create Account
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="w-full border-white/30 text-white hover:bg-white/10">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default LandingPage;
