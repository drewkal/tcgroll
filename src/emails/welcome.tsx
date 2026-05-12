// src/emails/welcome.tsx
import {
  Html, Head, Body, Container, Section, Text, Button, Hr, Img,
} from '@react-email/components'

interface WelcomeEmailProps {
  name: string
}

export function WelcomeEmail({ name }: WelcomeEmailProps) {
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
          <Section style={{ backgroundColor: '#0f1629', borderRadius: 16, padding: '40px 32px', border: '1px solid rgba(251,191,36,0.2)', textAlign: 'center', marginBottom: 24 }}>
            <Text style={{ fontSize: 40, margin: '0 0 8px' }}>🎉</Text>
            <Text style={{ fontSize: 28, fontWeight: 700, color: '#ffffff', letterSpacing: 3, margin: '0 0 8px', textTransform: 'uppercase' }}>
              Welcome, {name}!
            </Text>
            <Text style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.6, margin: '0 0 24px' }}>
              Your TCGRoll account is ready. You've been given{' '}
              <strong style={{ color: '#fbbf24' }}>🪙 500 bonus tokens</strong>{' '}
              to start opening cases right away.
            </Text>
            <Button
              href={`${baseUrl}/cases`}
              style={{
                backgroundColor: '#fbbf24',
                color: '#000000',
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: 2,
                padding: '14px 32px',
                borderRadius: 10,
                textDecoration: 'none',
                textTransform: 'uppercase',
              }}
            >
              Open Cases Now
            </Button>
          </Section>

          {/* What you can do */}
          <Section style={{ backgroundColor: '#0f1629', borderRadius: 16, padding: '28px 32px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 24 }}>
            <Text style={{ fontSize: 13, color: '#fbbf24', letterSpacing: 3, textTransform: 'uppercase', margin: '0 0 16px' }}>What you can do</Text>
            {[
              { emoji: '📦', title: 'Open Cases', desc: 'Roll virtual TCG cases across Pokémon, One Piece, Magic, and Dragon Ball.' },
              { emoji: '💰', title: 'Sell Cards', desc: 'Sell duplicates instantly for tokens — no waiting, no listings.' },
              { emoji: '🔄', title: 'Exchange', desc: 'Swap cards from your collection for ones you actually want.' },
              { emoji: '📬', title: 'Withdraw', desc: 'Request physical copies of your cards shipped to your door.' },
            ].map(({ emoji, title, desc }) => (
              <div key={title} style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                <Text style={{ fontSize: 20, margin: 0, lineHeight: 1 }}>{emoji}</Text>
                <div>
                  <Text style={{ fontSize: 14, fontWeight: 600, color: '#ffffff', margin: '0 0 2px' }}>{title}</Text>
                  <Text style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5 }}>{desc}</Text>
                </div>
              </div>
            ))}
          </Section>

          <Hr style={{ borderColor: 'rgba(255,255,255,0.06)', margin: '24px 0' }} />

          <Text style={{ fontSize: 12, color: '#475569', textAlign: 'center', lineHeight: 1.6 }}>
            You received this email because you created an account at TCGRoll.
            <br />Questions? Email us at <a href="mailto:support@tcgroll.com" style={{ color: '#fbbf24' }}>support@tcgroll.com</a>
          </Text>

        </Container>
      </Body>
    </Html>
  )
}

export default WelcomeEmail
