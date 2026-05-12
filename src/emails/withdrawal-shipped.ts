// src/emails/withdrawal-shipped.ts
const RARITY_COLOR: Record<string, string> = {
  LEGENDARY: '#f59e0b',
  EPIC:      '#a855f7',
  RARE:      '#3b82f6',
  UNCOMMON:  '#22c55e',
  COMMON:    '#9ca3af',
}

export function withdrawalShippedEmail({
  name,
  trackingNumber,
  cards,
  address,
}: {
  name: string
  trackingNumber: string
  cards: { name: string; rarity: string }[]
  address: { line1: string; line2: string }
}): string {
  const baseUrl = process.env.AUTH_URL ?? 'https://tcgroll.com'
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0e1a;font-family:Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
  <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

    <!-- Logo -->
    <tr><td align="center" style="padding-bottom:32px;">
      <span style="font-size:28px;font-weight:700;color:#fbbf24;letter-spacing:4px;">TCG<span style="color:#ffffff;">ROLL</span></span>
    </td></tr>

    <!-- Hero -->
    <tr><td style="background:#0f1629;border-radius:16px;border:1px solid rgba(168,85,247,0.3);padding:40px 32px;text-align:center;">
      <p style="font-size:40px;margin:0 0 8px;">📬</p>
      <p style="font-size:24px;font-weight:700;color:#ffffff;letter-spacing:3px;margin:0 0 8px;text-transform:uppercase;">Your Cards Are On The Way!</p>
      <p style="font-size:14px;color:#94a3b8;margin:0 0 4px;">Hey ${name}, your order has been shipped to:</p>
      <p style="font-size:14px;color:#cbd5e1;margin:0 0 24px;line-height:1.5;">${address.line1}<br>${address.line2}</p>

      <!-- Tracking -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.25);border-radius:10px;margin-bottom:24px;">
        <tr><td style="padding:16px 24px;text-align:center;">
          <p style="font-size:11px;color:#fbbf24;letter-spacing:3px;text-transform:uppercase;margin:0 0 6px;">Tracking Number</p>
          <p style="font-size:18px;color:#ffffff;font-family:monospace;font-weight:700;margin:0;">${trackingNumber}</p>
        </td></tr>
      </table>

      <a href="${baseUrl}/withdraw"
        style="display:inline-block;background:#fbbf24;color:#000000;font-weight:700;font-size:13px;letter-spacing:2px;padding:12px 28px;border-radius:10px;text-decoration:none;text-transform:uppercase;">
        View Withdrawal
      </a>
    </td></tr>

    <!-- Cards list -->
    <tr><td style="padding-top:16px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1629;border-radius:16px;border:1px solid rgba(255,255,255,0.06);">
        <tr><td style="padding:28px 32px;">
          <p style="font-size:12px;color:#94a3b8;letter-spacing:3px;text-transform:uppercase;margin:0 0 16px;">${cards.length} Card${cards.length !== 1 ? 's' : ''} Included</p>
          ${cards.map(card => `
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
            <tr>
              <td width="16">
                <div style="width:8px;height:8px;border-radius:50%;background:${RARITY_COLOR[card.rarity] ?? '#9ca3af'};"></div>
              </td>
              <td style="font-size:13px;color:#e2e8f0;padding-left:8px;">${card.name}</td>
              <td align="right" style="font-size:11px;color:${RARITY_COLOR[card.rarity] ?? '#9ca3af'};font-family:monospace;">${card.rarity}</td>
            </tr>
          </table>`).join('')}
        </td></tr>
      </table>
    </td></tr>

    <!-- Footer -->
    <tr><td style="padding-top:24px;text-align:center;">
      <p style="font-size:12px;color:#475569;line-height:1.6;margin:0;">
        Once delivered, mark your withdrawal as received in your account.<br>
        Issues? <a href="mailto:support@tcgroll.com" style="color:#fbbf24;">support@tcgroll.com</a>
      </p>
    </td></tr>

  </table>
  </td></tr></table>
</body>
</html>`
}
