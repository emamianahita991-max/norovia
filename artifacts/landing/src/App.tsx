import { useState } from "react";
import { copy } from "./copy";

function LandingPage() {
  const scrollToWaitlist = () => {
    document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" });
  };

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError(copy.waitlist.validationError);
      return;
    }
    setError("");
    setSubmitted(true);
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground font-sans">

      {/* 1. Hero */}
      <section className="px-6 pt-32 pb-24 md:pt-48 md:pb-32 max-w-4xl mx-auto flex flex-col items-center text-center">
        <h1 className="text-4xl md:text-6xl font-medium tracking-tight text-foreground/90 max-w-3xl leading-[1.15] mb-8">
          {copy.hero.headline}
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed mb-12">
          {copy.hero.subheadline}
        </p>
        <button
          onClick={scrollToWaitlist}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-full text-base font-medium transition-all hover:-translate-y-0.5 shadow-sm hover:shadow active:translate-y-0"
        >
          {copy.hero.cta}
        </button>
        <p className="mt-8 text-sm text-muted-foreground/80 max-w-md mx-auto">
          {copy.hero.supporting}
        </p>
      </section>

      {/* 2. Problem */}
      <section className="px-6 py-24 md:py-32 bg-card/40">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-medium mb-6 text-foreground/90">
            {copy.problem.title}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            {copy.problem.body}
          </p>
        </div>
      </section>

      {/* 3. Feature cards */}
      <section className="px-6 py-24 md:py-32 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {copy.features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-card rounded-2xl p-8 md:p-10 shadow-sm border border-card-border/50 hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <span className="text-primary font-serif italic text-lg">{idx + 1}</span>
              </div>
              <h3 className="text-xl font-medium mb-4 text-foreground/90">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Flare Mode */}
      <section className="px-6 py-24 md:py-32" style={{ backgroundColor: "#F7EBE5" }}>
        <div className="max-w-3xl mx-auto flex flex-col gap-8">
          <h2 className="text-3xl md:text-4xl font-medium" style={{ color: "#4A2D23" }}>
            {copy.flareMode.title}
          </h2>
          <p className="text-lg md:text-xl leading-relaxed" style={{ color: "#6B4739" }}>
            {copy.flareMode.body}
          </p>
          <div className="p-6 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.5)", border: "1px solid rgba(227,198,185,0.5)" }}>
            <p className="text-sm font-medium leading-relaxed" style={{ color: "#8F482F" }}>
              {copy.flareMode.safety}
            </p>
          </div>
        </div>
      </section>

      {/* 5. Waitlist */}
      <section id="waitlist" className="px-6 py-24 md:py-32 max-w-xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-medium mb-6 text-foreground/90">
          {copy.waitlist.title}
        </h2>
        <p className="text-lg text-muted-foreground leading-relaxed mb-12">
          {copy.waitlist.body}
        </p>

        <div className="bg-card rounded-3xl p-8 md:p-12 shadow-sm border border-card-border/50">
          {submitted ? (
            <div className="py-8">
              <div className="w-14 h-14 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center mb-6">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <h3 className="text-xl font-medium text-foreground/90">
                {copy.waitlist.confirmation}
              </h3>
            </div>
          ) : (
            <form onSubmit={handleWaitlistSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={copy.waitlist.placeholder}
                  className="flex-1 px-6 py-4 rounded-full bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-base"
                />
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-full text-base font-medium transition-all shadow-sm active:scale-[0.98]"
                >
                  {copy.waitlist.button}
                </button>
              </div>
              {error && (
                <p className="text-sm text-destructive text-left px-2">{error}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {copy.waitlist.smallText}
              </p>
            </form>
          )}
        </div>
      </section>

      {/* 6. Footer disclaimer */}
      <footer className="px-6 py-16 md:py-20 border-t border-border/40">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm text-muted-foreground/60 leading-relaxed">
            {copy.footer.disclaimer}
          </p>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return <LandingPage />;
}
