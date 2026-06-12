// src/app/terms/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Read the TCGRoll Terms of Service.',
}

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <p className="text-yellow-400 font-mono text-sm tracking-widest mb-2">— LEGAL</p>
      <h1 className="font-display text-6xl tracking-wide text-white mb-2">TERMS OF SERVICE</h1>
      <p className="text-slate-500 font-mono text-sm mb-12">Last updated: June 2025</p>

      <div className="space-y-10 text-slate-300 leading-relaxed">

        <section>
          <h2 className="font-display text-2xl text-white tracking-wide mb-3">1. Acceptance of Terms</h2>
          <p>By accessing or using TCGRoll you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree, stop using the platform immediately.</p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-white tracking-wide mb-3">2. Virtual Tokens</h2>
          <p>Tokens (🪙) on TCGRoll are virtual in-platform currency with no real-world monetary value. Tokens cannot be redeemed for cash, transferred between accounts, or sold outside of TCGRoll. All token purchases are final and non-refundable except where required by law.</p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-white tracking-wide mb-3">3. Virtual Cards & Physical Withdrawals</h2>
          <p>Cards obtained through case openings or exchanges are virtual goods. You may request physical copies of cards you own via the withdrawal system. Physical card fulfillment is subject to availability and processing time. TCGRoll reserves the right to substitute equivalent cards of equal or greater value if a specific card is unavailable. Virtual cards and token balances have no cash value and cannot be refunded.</p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-white tracking-wide mb-3">4. User Accounts</h2>
          <p>You must be 18 years or older to create an account and purchase tokens. By registering, you confirm you meet this age requirement. You are responsible for all activity that occurs under your account and for keeping your login credentials confidential. One account per person — duplicate accounts may be suspended.</p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-white tracking-wide mb-3">5. Prohibited Conduct</h2>
          <p>You agree not to: exploit bugs or glitches, use automated bots, attempt to manipulate drop rates, reverse-engineer the platform, or engage in any fraudulent activity. Violations may result in immediate account termination and forfeiture of tokens.</p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-white tracking-wide mb-3">6. Welcome Bonus & Promotions</h2>
          <p>Token bonuses (including the welcome bonus) are awarded at our discretion and may be changed or discontinued at any time. Bonuses are non-transferable and have no cash value. We reserve the right to reclaim bonus tokens if accounts are found to be fraudulent or in violation of these terms.</p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-white tracking-wide mb-3">7. Intellectual Property</h2>
          <p>All card imagery, names, and trademarks belong to their respective owners (Nintendo / The Pokémon Company, Bandai, Wizards of the Coast, Toei Animation). TCGRoll is an independent platform and is not affiliated with, endorsed by, or sponsored by any of these companies.</p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-white tracking-wide mb-3">8. Limitation of Liability</h2>
          <p>TCGRoll is provided "as is" without warranties of any kind. We are not liable for any loss of virtual items, token balances, or data resulting from technical failures, unauthorized access, or service interruptions.</p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-white tracking-wide mb-3">9. Changes to Terms</h2>
          <p>We may update these terms at any time. Continued use of TCGRoll after changes constitutes acceptance of the new terms. We will notify users of significant changes via email or in-platform notice.</p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-white tracking-wide mb-3">10. Contact</h2>
          <p>Questions about these terms? Email us at <a href="mailto:support@tcgroll.com" className="text-yellow-400 hover:underline">support@tcgroll.com</a>.</p>
        </section>

      </div>
    </div>
  )
}
