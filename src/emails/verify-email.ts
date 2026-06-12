export function verifyEmailTemplate({ name, verifyUrl }: { name: string; verifyUrl: string }): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0e1a;font-family:Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
  <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

    <tr><td align="center" style="padding-bottom:32px;">
      <span style="font-size:28px;font-weight:700;color:#fbbf24;letter-spacing:4px;">TCG<span style="color:#ffffff;">ROLL</span></span>
    </td></tr>

    <tr><td style="background:#0f1629;border-radius:16px;border:1px solid rgba(251,191,36,0.2);padding:40px 32px;text-align:center;">
      <p style="font-size:36px;margin:0 0 8px;">📬</p>
      <p style="font-size:24px;font-weight:700;color:#ffffff;letter-spacing:3px;margin:0 0 12px;text-transform:uppercase;">Verify your email</p>
      <p style="font-size:15px;color:#94a3b8;line-height:1.6;margin:0 0 8px;">
        Hi ${name} — click below to verify your email and claim your
      </p>
      <p style="font-size:22px;font-weight:700;color:#fbbf24;margin:0 0 28px;">🪙 750 free tokens</p>
      <a href="${verifyUrl}"
        style="display:inline-block;background:#fbbf24;color:#000000;font-weight:700;font-size:14px;letter-spacing:2px;padding:14px 32px;border-radius:10px;text-decoration:none;text-transform:uppercase;">
        Verify Email &amp; Claim Tokens
      </a>
      <p style="font-size:12px;color:#475569;margin:24px 0 0;">Link expires in 24 hours.</p>
    </td></tr>

    <tr><td style="padding-top:24px;text-align:center;">
      <p style="font-size:12px;color:#475569;line-height:1.6;margin:0;">
        If you didn't create a TCGRoll account, you can ignore this email.<br>
        Questions? <a href="mailto:support@tcgroll.com" style="color:#fbbf24;">support@tcgroll.com</a>
      </p>
    </td></tr>

  </table>
  </td></tr></table>
</body>
</html>`
}
