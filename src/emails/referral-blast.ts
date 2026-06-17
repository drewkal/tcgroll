export function referralBlastEmail({
  name,
  referralCode,
  referralUrl,
}: {
  name: string
  referralCode: string
  referralUrl: string
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Earn free tokens — refer a friend to TCGRoll</title>
</head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:'Segoe UI',Arial,sans-serif;color:#e2e8f0;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1e;padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" style="max-width:560px;background:#111827;border-radius:16px;border:1px solid rgba(251,191,36,0.15);overflow:hidden;">

      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#111827 0%,#1e2d4a 100%);padding:36px 40px 28px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.05);">
          <div style="font-size:13px;color:#fbbf24;letter-spacing:0.2em;font-family:monospace;margin-bottom:12px;">— TCGROLL REFERRAL PROGRAM</div>
          <h1 style="margin:0;font-size:32px;font-weight:800;color:#ffffff;letter-spacing:0.05em;line-height:1.2;">EARN FREE TOKENS 🪙</h1>
          <p style="margin:12px 0 0;color:#94a3b8;font-size:15px;line-height:1.6;">Share TCGRoll. We'll pay you for it.</p>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:36px 40px;">
          <p style="margin:0 0 20px;color:#cbd5e1;font-size:15px;line-height:1.7;">
            Hey ${name},
          </p>
          <p style="margin:0 0 24px;color:#cbd5e1;font-size:15px;line-height:1.7;">
            We've just launched our referral program — and you're already in.
            Every time a friend signs up using your link and verifies their email,
            <strong style="color:#fbbf24;">you earn 🪙 500 tokens instantly</strong>. No limit on how many friends you can refer.
          </p>

          <!-- How it works -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr>
              <td style="background:#1e293b;border-radius:12px;padding:20px 24px;">
                <div style="font-size:11px;color:#64748b;letter-spacing:0.15em;font-family:monospace;margin-bottom:14px;">HOW IT WORKS</div>
                <table width="100%" cellpadding="0" cellspacing="8">
                  <tr>
                    <td style="padding:6px 0;">
                      <span style="color:#fbbf24;font-weight:700;margin-right:10px;">01</span>
                      <span style="color:#e2e8f0;font-size:14px;">Share your unique referral link below</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;">
                      <span style="color:#a78bfa;font-weight:700;margin-right:10px;">02</span>
                      <span style="color:#e2e8f0;font-size:14px;">Friend signs up and verifies their email</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;">
                      <span style="color:#34d399;font-weight:700;margin-right:10px;">03</span>
                      <span style="color:#e2e8f0;font-size:14px;">You receive 🪙 500 tokens — they get their 🪙 500 welcome bonus too</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Referral code box -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr>
              <td style="background:#0f172a;border:1px solid rgba(251,191,36,0.25);border-radius:12px;padding:20px 24px;">
                <div style="font-size:11px;color:#64748b;letter-spacing:0.15em;font-family:monospace;margin-bottom:8px;">YOUR REFERRAL CODE</div>
                <div style="font-size:24px;font-weight:800;color:#fbbf24;font-family:monospace;letter-spacing:0.1em;margin-bottom:12px;">${referralCode}</div>
                <div style="font-size:12px;color:#475569;font-family:monospace;word-break:break-all;">${referralUrl}</div>
              </td>
            </tr>
          </table>

          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr>
              <td align="center">
                <a href="${referralUrl}" style="display:inline-block;background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#000000;font-weight:800;font-size:15px;letter-spacing:0.08em;padding:14px 36px;border-radius:10px;text-decoration:none;">
                  VIEW MY REFERRAL PAGE →
                </a>
              </td>
            </tr>
          </table>

          <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;text-align:center;">
            You can also find your link anytime on your <a href="https://tcgroll.com/profile" style="color:#fbbf24;text-decoration:none;">profile page</a>.
          </p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#0d1424;padding:20px 40px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
          <p style="margin:0 0 8px;color:#475569;font-size:12px;">
            <a href="https://tcgroll.com" style="color:#fbbf24;text-decoration:none;font-weight:600;">TCGRoll</a> — Virtual TCG Case Opening
          </p>
          <p style="margin:0;color:#334155;font-size:11px;">
            You received this because you have an account at tcgroll.com.
            <a href="https://tcgroll.com/profile" style="color:#475569;">Manage preferences</a>
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}
