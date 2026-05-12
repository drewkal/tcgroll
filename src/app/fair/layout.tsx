import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Provably Fair',
  description: 'TCGRoll uses a transparent weighted random algorithm with published drop rates. No hidden modifiers, no pity manipulation. Verify the odds yourself with our live simulator.',
}

export default function FairLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
