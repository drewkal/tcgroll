// src/emails/withdrawal-shipped.tsx
import {
  Html, Head, Body, Container, Section, Text, Button, Hr,
} from '@react-email/components'

interface WithdrawalShippedEmailProps {
  name: string
  trackingNumber: string
  cards: { name: string; rarity: string }[]
  address: { line1: string; line2: string }
}

const RARITY_COLOR: Record<string, string> = {
  LEGENDARY: '#f59e0b',
  EPIC:      '#a855f7',
  RARE:      '#3b82f6',
  UNCOMMON:  '#22c55e',
  COMMON:    '#9ca3af',
}

export function WithdrawalShippedEmail({ name, trackingNumber, cards, address }: WithdrawalShippedEmailProps) {
  const baseUrl = process.env.AUTH_URL ?? 'https://tcgroll.com'

  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#0a0e1a', fontFamily: 'Barlow, Helvetica, Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 560, margin: '0 auto', padding: '40px 20px' }}>

          {/* Logo */}
          <Section style={{ textAlign: 'center', marginBottom: 32 }}>
            <Text style={{ fontSize: 28, fontWeight: 700, color: '#fbbf24', letterSpacing: 4, margin: 0 }}>
              TCG<span style={{ color: '#ffffff' }}>ROLL</span>
            </Text>
          </Section>

          {/* Hero */}
          <Section style={{ backgroundColor: '#0f1629', borderRadius: 16, padding: '40px 32px', border: '1px solid rgba(168,85,247,0.3)', textAlign: 'center', marginBottom: 24 }}>
            <Text style={{ fontSize: 40, margin: '0 0 8px' }}>📬</Text>
            <Text style={{ fontSize: 26, fontWeight: 700, color: '#ffffff', letterSpacing: 3, margin: '0 0 8px', textTransform: 'uppercase' }}>
              Your Cards Are On The Way!
            </Text>
            <Text style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.6, margin: '0 0 8px' }}>
              Hey {name}, your withdrawal has been shipped to:
            </Text>
            <Text style={{ fontSize: 14, color: '#cbd5e1', margin: '0 0 24px', lineHeight: 1.5 }}>
              {address.line1}<br />{address.line2}
            </Text>

            {/* Tracking */}
            <div style={{ backgroundColor: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 10, padding: '16px 24px', marginBottom: 24 }}>
              <Text style={{ fontSize: 11, color: '#fbbf24', letterSpacing: 3, textTransform: 'uppercase', margin: '0 0 6px' }}>Tracking Number</Text>
              <Text style={{ fontSize: 18, color: '#ffffff', fontFamily: 'monospace', fontWeight: 700, margin: 0 }}>{trackingNumber}</Text>
            </div>

            <Button
              href={`${baseUrl}/withdraw`}
              style={{
                backgroundColor: '#fbbf24',
                color: '#000000',
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: 2,
                padding: '12px 28px',
                borderRadius: 10,
                textDecoration: 'none',
                textTransform: 'uppercase',
              }}
            >
              View Withdrawal
            </Button>
          </Section>

          {/* Cards list */}
          <Section style={{ backgroundColor: '#0f1629', borderRadius: 16, padding: '28px 32px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 24 }}>
            <Text style={{ fontSize: 13, color: '#94a3b8', letterSpacing: 3, textTransform: 'uppercase', margin: '0 0 16px' }}>
              {cards.length} Card{cards.length !== 1 ? 's' : ''} Included
            </Text>
            {cards.map((card, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: RARITY_COLOR[card.rarity] ?? '#9ca3af', flexShrink: 0 }} />
                <Text style={{ fontSize: 13, color: '#e2e8f0', margin: 0, flex: 1 }}>{card.name}</Text>
                <Text style={{ fontSize: 11, color: RARITY_COLOR[card.rarity] ?? '#9ca3af', margin: 0, fontFamily: 'monospace' }}>
                  {card.rarity}
                </Text>
              </div>
            ))}
          </Section>

          <Hr style={{ borderColor: 'rgba(255,255,255,0.06)', margin: '24px 0' }} />

          <Text style={{ fontSize: 12, color: '#475569', textAlign: 'center', lineHeight: 1.6 }}>
            Once delivered, please mark your withdrawal as received in your account.
            <br />Issues? Email us at <a href="mailto:support@tcgroll.com" style={{ color: '#fbbf24' }}>support@tcgroll.com</a>
          </Text>

        </Container>
      </Body>
    </Html>
  )
}

export default WithdrawalShippedEmail
