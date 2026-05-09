// src/app/faq/page.tsx
'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const FAQS = [
  {
    q: 'What is TCGRoll?',
    a: 'TCGRoll is a virtual card opening platform where you use tokens (🪙) to open cases across four Trading Card Games: Pokémon, One Piece, Magic: The Gathering, and Dragon Ball. Collect cards, sell them for tokens, and build your dream collection.',
  },
  {
    q: 'Are the tokens real money?',
    a: 'No. Tokens are virtual in-platform currency with no real-world monetary value. They cannot be cashed out. You can purchase tokens to open cases, earn them by selling cards, or receive them as bonuses.',
  },
  {
    q: 'How do drop rates work?',
    a: 'Every case has a defined drop rate for each card, visible on the case detail page. When you open a case, a card is selected using provably fair weighted randomness based on those rates — just like real pack odds.',
  },
  {
    q: 'Can I get physical cards?',
    a: 'Yes! Any card in your collection can be submitted for physical withdrawal. Head to the Withdraw page, select the cards you want, enter your shipping address, and we\'ll ship them to you. Withdrawal availability depends on stock.',
  },
  {
    q: 'How does the Exchange work?',
    a: 'The Exchange lets you swap any card in your collection for any card in our catalog. If the card you want is worth more tokens than the one you\'re giving up, the difference is deducted from your balance. If it\'s worth less, the difference is added to your balance.',
  },
  {
    q: 'How do I sell cards?',
    a: 'Go to your Collection, select one or more cards, and hit "Sell Selected." The cards are instantly converted to tokens at their listed value, which is added to your balance.',
  },
  {
    q: 'What happens to my token balance?',
    a: 'Your token balance is shown in the navigation bar at all times. It increases when you sell cards or receive bonuses, and decreases when you open cases or exchange up to a higher-value card.',
  },
  {
    q: 'I found a bug or have a suggestion.',
    a: 'We\'d love to hear from you! Email us at support@tcgroll.com or open an issue on our GitHub. We actively improve the platform based on community feedback.',
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left gap-4"
      >
        <span className="font-medium text-white text-base">{q}</span>
        <ChevronDown
          size={18}
          className="text-slate-400 flex-shrink-0 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>
      {open && (
        <p className="text-slate-400 text-sm leading-relaxed pb-5">{a}</p>
      )}
    </div>
  )
}

export default function FAQPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <p className="text-yellow-400 font-mono text-sm tracking-widest mb-2">— HELP</p>
      <h1 className="font-display text-6xl tracking-wide text-white mb-4">FAQ</h1>
      <p className="text-slate-400 mb-12">Frequently asked questions about TCGRoll.</p>

      <div className="glass rounded-2xl border border-white/5 px-6">
        {FAQS.map(item => (
          <FAQItem key={item.q} {...item} />
        ))}
      </div>

      <p className="text-center text-slate-500 text-sm mt-10">
        Still have questions?{' '}
        <a href="mailto:support@tcgroll.com" className="text-yellow-400 hover:underline">support@tcgroll.com</a>
      </p>
    </div>
  )
}
