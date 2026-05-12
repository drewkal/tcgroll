// src/lib/email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM ?? 'TCGRoll <noreply@tcgroll.com>'

export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string
  subject: string
  react: React.ReactElement
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set, skipping email to', to)
    return
  }
  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, react })
    if (error) console.error('[email] Send error:', error)
  } catch (e) {
    console.error('[email] Unexpected error:', e)
  }
}
