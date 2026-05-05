// src/app/privacy/page.tsx
export default function privacy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="font-display text-5xl tracking-wide text-white mb-2">
        Privacy Policy
      </h1>
      <p className="text-slate-500 font-mono text-sm mb-12">Last updated: January 2025</p>

      <div className="space-y-10 text-slate-300 leading-relaxed">

        <section>
          <h2 className="font-display text-2xl text-white tracking-wide mb-3">1. Acceptance of Terms</h2>
          <p>By accessing and using TCGRoll, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use this service.</p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-white tracking-wide mb-3">2. Virtual Credits</h2>
          <p>Credits on TCGRoll have no real-world monetary value and cannot be exchanged for cash. Credits are used solely to open virtual card cases on the platform.</p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-white tracking-wide mb-3">3. User Accounts</h2>
          <p>You are responsible for maintaining the security of your account. You must be 18 years or older to use this service.</p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-white tracking-wide mb-3">4. Virtual Items</h2>
          <p>All cards and virtual items obtained through TCGRoll are virtual goods with no real-world value. We reserve the right to modify or discontinue any virtual item at any time.</p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-white tracking-wide mb-3">5. Contact</h2>
          <p>For any questions regarding these terms, contact us at: <a href="mailto:legal@tcgroll.com" className="text-yellow-400">legal@tcgroll.com</a></p>
        </section>

      </div>
    </div>
  )
}