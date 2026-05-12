export function PrivacyPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground font-sans">
      <div className="max-w-2xl mx-auto px-6 py-16 md:py-24">
        <button
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-12 flex items-center gap-2"
        >
          ← Back
        </button>

        <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-6">
          Norovia
        </p>
        <h1 className="text-3xl md:text-4xl font-medium text-foreground/90 mb-4">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground mb-12">
          Last updated: May 2026
        </p>

        <div className="prose prose-sm max-w-none text-foreground/80 leading-relaxed space-y-8">
          <section>
            <h2 className="text-lg font-medium text-foreground/90 mb-3">What we collect</h2>
            <p>
              When you join the Norovia beta waitlist, we collect your email address. That is the only personal information we store.
            </p>
            <p className="mt-3">
              We do not collect your name, location, health information, or any other personal data through this website.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-foreground/90 mb-3">Why we collect it</h2>
            <p>
              Your email address is used solely to send you beta access invitations and updates about Norovia. We will not use it for advertising, analytics, or any other purpose.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-foreground/90 mb-3">How long we keep it</h2>
            <p>
              We keep your email address until you ask us to remove it, or until the beta program concludes and we no longer need it for that purpose.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-foreground/90 mb-3">Who we share it with</h2>
            <p>
              We do not sell, rent, or share your email address with third parties. Your contact information stays with Norovia.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-foreground/90 mb-3">Your rights</h2>
            <p>
              You can ask us to remove your email from our list at any time. To do so, email us at{" "}
              <a
                href="mailto:hello@norovia.ca"
                className="text-primary underline underline-offset-2"
              >
                hello@norovia.ca
              </a>{" "}
              and we will remove your information within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-foreground/90 mb-3">Contact</h2>
            <p>
              If you have questions about this policy, you can reach us at{" "}
              <a
                href="mailto:hello@norovia.ca"
                className="text-primary underline underline-offset-2"
              >
                hello@norovia.ca
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-border/40">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Norovia is not medical care and does not diagnose, treat, or replace professional medical advice. If you are experiencing severe or concerning symptoms, contact a clinician or emergency services.
          </p>
        </div>
      </div>
    </div>
  );
}
