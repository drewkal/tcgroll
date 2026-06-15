import { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle, AlertCircle, Shield, Star } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Card Quality',
  description: 'All cards shipped by TCGRoll are guaranteed Near Mint condition or better. Learn how we grade and inspect every card before it reaches you.',
  alternates: { canonical: 'https://tcgroll.com/card-quality' },
}

const IMPERFECTIONS = [
  {
    name: 'Scratch',
    icon: '✂️',
    desc: 'A mark that cuts or scrapes the card surface, removing material. Also referred to as scores or gouges.',
    examples: ['Surface cut', 'Score line', 'Gouge'],
  },
  {
    name: 'Scuffing',
    icon: '🌫️',
    desc: 'Light scratch patterns or surface abrasion covering an area, often appearing as cloudiness, a blister glaze, or a buffed effect.',
    examples: ['Cloudy surface', 'Blister glaze', 'Buffing marks'],
  },
  {
    name: 'Indentation',
    icon: '🔵',
    desc: 'A groove or depression pushed into the card surface without breaking it. Does not remove material.',
    examples: ['Ding', 'Dent', 'Impression', 'Pockmark'],
  },
  {
    name: 'Edgewear',
    icon: '📐',
    desc: 'Loss of colour or material along the edges, borders, or corners of the card.',
    examples: ['Border wear', 'Corner nick', 'Fraying', 'Flaking'],
  },
  {
    name: 'Defect',
    icon: '🏭',
    desc: 'A manufacturing error unrelated to handling or play wear.',
    examples: ['Ink issues', 'Crimping', 'Miscut', 'Foil bubbling', 'Centering problem'],
  },
]

const SCORES = [
  { label: 'Slight',   points: 1, desc: 'Minimal surface area impacted — barely noticeable' },
  { label: 'Minor',    points: 2, desc: 'Noticeable but limited surface area' },
  { label: 'Moderate', points: 4, desc: 'Significant surface area affected' },
  { label: 'Major',    points: 8, desc: 'Extensive surface area — card likely unacceptable' },
]

export default function CardQualityPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">

      {/* Hero */}
      <p className="text-yellow-400 font-mono text-sm tracking-widest mb-3">— OUR STANDARD</p>
      <h1 className="font-display text-5xl md:text-6xl tracking-wide text-white mb-5">CARD QUALITY</h1>
      <p className="text-slate-400 text-lg leading-relaxed mb-12">
        Every card we ship is individually inspected before it leaves our warehouse.
        We guarantee <span className="text-white font-semibold">Near Mint condition or better</span> on all orders — a higher standard than you'd typically pull from a physical booster pack.
      </p>

      {/* Guarantee banner */}
      <div className="glass rounded-2xl border border-yellow-400/30 bg-yellow-400/5 p-7 flex gap-4 items-start mb-16">
        <Shield size={36} className="text-yellow-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-display text-2xl text-yellow-400 tracking-wide mb-2">OUR QUALITY GUARANTEE</p>
          <p className="text-slate-300 leading-relaxed">
            All cards shipped by TCGRoll are in <strong className="text-white">Near Mint (NM) condition or better</strong>.
            If a card arrives in a condition below Near Mint due to our handling or shipping, we will replace it or refund its value — no questions asked.
          </p>
          <Link href="/faq" className="text-yellow-400 text-sm font-mono mt-3 inline-block hover:underline">
            See our shipping FAQ →
          </Link>
        </div>
      </div>

      {/* What is Near Mint */}
      <div className="mb-16">
        <h2 className="font-display text-3xl text-white tracking-wide mb-2">What is Near Mint?</h2>
        <p className="text-slate-400 mb-6 leading-relaxed">
          Near Mint (NM) cards show minimal or no signs of handling or play wear. A card qualifies as Near Mint when its total imperfection score is <strong className="text-white">4 points or under</strong> across all five imperfection categories below.
        </p>
        <div className="glass rounded-2xl border border-green-400/20 bg-green-400/5 p-5 flex items-center gap-4">
          <CheckCircle size={28} className="text-green-400 flex-shrink-0" />
          <p className="text-slate-300 text-sm leading-relaxed">
            Near Mint cards may have very slight indentations, minor scratches, slight edgewear, slight scuffing, or minor manufacturing defects — but their total score must not exceed 4 points. Cards scoring 5 or above are not shipped.
          </p>
        </div>
      </div>

      {/* Imperfection types */}
      <div className="mb-16">
        <h2 className="font-display text-3xl text-white tracking-wide mb-2">Imperfection Types</h2>
        <p className="text-slate-400 mb-7 leading-relaxed">
          We assess each card across five categories. Every imperfection is scored by severity before a card is approved for shipping.
        </p>
        <div className="space-y-4">
          {IMPERFECTIONS.map(({ name, icon, desc, examples }) => (
            <div key={name} className="glass rounded-xl border border-white/5 p-5 hover:border-white/10 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">{icon}</span>
                <h3 className="font-display text-xl text-white tracking-wide">{name}</h3>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-3">{desc}</p>
              <div className="flex flex-wrap gap-2">
                {examples.map(ex => (
                  <span key={ex} className="text-xs font-mono text-slate-500 bg-white/5 border border-white/5 px-2.5 py-1 rounded-full">
                    {ex}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scoring scale */}
      <div className="mb-16">
        <h2 className="font-display text-3xl text-white tracking-wide mb-2">Severity Scoring</h2>
        <p className="text-slate-400 mb-7 leading-relaxed">
          Each imperfection is scored by how much surface area it affects. A card's total score across all categories must be 4 or under to qualify as Near Mint.
        </p>
        <div className="overflow-hidden rounded-2xl border border-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/3">
                <th className="text-left px-5 py-3 font-mono text-xs text-slate-500 tracking-widest">SEVERITY</th>
                <th className="text-center px-5 py-3 font-mono text-xs text-slate-500 tracking-widest">POINTS</th>
                <th className="text-left px-5 py-3 font-mono text-xs text-slate-500 tracking-widest hidden sm:table-cell">DESCRIPTION</th>
              </tr>
            </thead>
            <tbody>
              {SCORES.map(({ label, points, desc }, i) => (
                <tr key={label} className={`border-b border-white/5 last:border-0 ${i % 2 === 0 ? '' : 'bg-white/2'}`}>
                  <td className="px-5 py-4 font-display text-white tracking-wide">{label}</td>
                  <td className="px-5 py-4 text-center">
                    <span className="font-mono font-bold" style={{ color: points <= 2 ? '#34d399' : points === 4 ? '#fbbf24' : '#f87171' }}>
                      {points}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-400 hidden sm:table-cell">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs font-mono text-slate-600 mt-3 px-1">
          ✓ Near Mint = total score ≤ 4 &nbsp;|&nbsp; ✗ Cards scoring ≥ 5 are not shipped
        </p>
      </div>

      {/* Packaging */}
      <div className="mb-16">
        <h2 className="font-display text-3xl text-white tracking-wide mb-2">How We Pack Your Cards</h2>
        <p className="text-slate-400 mb-7 leading-relaxed">
          Condition doesn't end at inspection — we take care to protect every card during transit.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: '🛡️', title: 'Sleeve First', desc: 'Every card is inserted into a soft penny sleeve before packing.' },
            { icon: '📦', title: 'Top Loader', desc: 'Sleeved cards are secured in a rigid top loader or card saver to prevent bending.' },
            { icon: '📬', title: 'Padded Mailer', desc: 'Orders ship in a bubble-lined, rigid mailer to survive transit.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="glass rounded-xl border border-white/5 p-5 text-center">
              <div className="text-3xl mb-3">{icon}</div>
              <h3 className="font-display text-white tracking-wide mb-1">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Dispute */}
      <div className="glass rounded-2xl border border-red-400/20 bg-red-400/5 p-6 flex gap-4 items-start mb-16">
        <AlertCircle size={24} className="text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-display text-lg text-white tracking-wide mb-1">Received a damaged card?</p>
          <p className="text-slate-400 text-sm leading-relaxed">
            If a card arrives below Near Mint condition through no fault of your own, contact us within 7 days of delivery with a photo. We'll replace the card or refund its full token value.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <Star size={32} className="text-yellow-400 mx-auto mb-4" />
        <h2 className="font-display text-3xl text-white tracking-wide mb-3">Start Your Collection</h2>
        <p className="text-slate-400 mb-7">Open cases and receive Near Mint cards shipped directly to your door.</p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/cases" className="btn-gold px-8 py-3 rounded-xl font-display tracking-widest">
            Browse Cases
          </Link>
          <Link href="/how-it-works" className="px-8 py-3 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:border-white/20 transition-all font-display tracking-wider">
            How It Works
          </Link>
        </div>
      </div>

    </div>
  )
}
