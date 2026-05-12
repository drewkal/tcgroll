// src/emails/welcome.ts
export function welcomeEmail({ name }: { name: string }): string {
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
    <tr><td style="background:#0f1629;border-radius:16px;border:1px solid rgba(251,191,36,0.2);padding:40px 32px;text-align:center;">
      <p style="font-size:40px;margin:0 0 8px;">🎉</p>
      <p style="font-size:26px;font-weight:700;color:#ffffff;letter-spacing:3px;margin:0 0 12px;text-transform:uppercase;">Welcome, ${name}!</p>
      <p style="font-size:15px;color:#94a3b8;line-height:1.6;margin:0 0 24px;">
        Your TCGRoll account is ready. You've been given
        <strong style="color:#fbbf24;">🪙 500 bonus tokens</strong>
        to start opening cases right away.
      </p>
      <a href="${baseUrl}/cases"
        style="display:inline-block;background:#fbbf24;color:#000000;font-weight:700;font-size:14px;letter-spacing:2px;padding:14px 32px;border-radius:10px;text-decoration:none;text-transform:uppercase;">
        Open Cases Now
      </a>
    </td></tr>

    <!-- Features -->
    <tr><td style="padding-top:16px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1629;border-radius:16px;border:1px solid rgba(255,255,255,0.06);">
        <tr><td style="padding:28px 32px;">
          <p style="font-size:12px;color:#fbbf24;letter-spacing:3px;text-transform:uppercase;margin:0 0 20px;">What you can do</p>
          ${[
            ['📦', 'Open Cases', 'Roll virtual TCG cases across Pokémon, One Piece, Magic, and Dragon Ball.'],
            ['💰', 'Sell Cards', 'Sell duplicates instantly for tokens — no waiting, no listings.'],
            ['🔄', 'Exchange', 'Swap cards from your collection for ones you actually want.'],
            ['📬', 'Withdraw', 'Request physical copies of your cards shipped to your door.'],
          ].map(([emoji, title, desc]) => `
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
            <tr>
              <td width="32" style="vertical-align:top;font-size:20px;">${emoji}</td>
              <td style="vertical-align:top;padding-left:8px;">
                <p style="font-size:14px;font-weight:600;color:#ffffff;margin:0 0 2px;">${title}</p>
                <p style="font-size:13px;color:#64748b;margin:0;line-height:1.5;">${desc}</p>
              </td>
            </tr>
          </table>`).join('')}
        </td></tr>
      </table>
    </td></tr>

    <!-- Footer -->
    <tr><td style="padding-top:24px;text-align:center;">
      <p style="font-size:12px;color:#475569;line-height:1.6;margin:0;">
        You received this because you created a TCGRoll account.<br>
        Questions? <a href="mailto:support@tcgroll.com" style="color:#fbbf24;">support@tcgroll.com</a>
      </p>
    </td></tr>

  </table>
  </td></tr></table>
</body>
</html>`
}
