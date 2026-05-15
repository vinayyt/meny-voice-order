// ─── Generate unique order ID ──────────────────────────────────────────────────
function genOrderId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "MV-";
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

// ─── Format timestamp ─────────────────────────────────────────────────────────
function formatDate() {
  return new Date().toLocaleString("nb-NO", {
    timeZone: "Europe/Oslo",
    weekday: "long", year: "numeric", month: "long",
    day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

// ─── HTML email template ──────────────────────────────────────────────────────
function buildEmailHtml({ orderId, date, cart, customerName, customerEmail, customerPhone, deliveryAddress, notes, chatHistory, grandTotal }) {
  const itemRows = cart.map((item, i) => {
    const lineTotal = item.price > 0 ? (item.price * item.qty).toFixed(0) + " kr" : "—";
    const bg = i % 2 === 0 ? "#FFFFFF" : "#FAF7F2";
    return `
      <tr style="background:${bg};">
        <td style="padding:10px 14px;font-size:14px;color:#1F1B14;">${item.name}</td>
        <td style="padding:10px 14px;text-align:center;font-size:14px;color:#4A4438;">${item.qty} ${item.unit}</td>
        <td style="padding:10px 14px;text-align:right;font-size:14px;font-weight:600;color:#1F1B14;">${lineTotal}</td>
      </tr>`;
  }).join("");

  const historyRows = (chatHistory || []).slice(-20).map(m => {
    const isUser = m.role === "user";
    return `
      <div style="margin-bottom:10px;">
        <span style="font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:${isUser ? "#D62828" : "#4A6A42"};">
          ${isUser ? "Kunde" : "MENY AI"}
        </span>
        <div style="margin-top:4px;font-size:14px;color:#4A4438;padding-left:8px;border-left:2px solid ${isUser ? "#D62828" : "#4A6A42"};">${m.content}</div>
      </div>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="no">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>MENY Bestilling ${orderId}</title></head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Arial,sans-serif;background:#F4EEE2;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4EEE2;padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
  <tr><td style="background:#D62828;border-radius:12px 12px 0 0;padding:28px 32px;text-align:center;">
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:900;letter-spacing:6px;color:#FFFFFF;">MENY</div>
    <div style="color:rgba(255,255,255,0.85);font-size:14px;margin-top:6px;">AI Bestillingsassistent</div>
  </td></tr>
  <tr><td style="background:#1F1B14;padding:12px 32px;text-align:center;">
    <span style="font-family:monospace;font-size:13px;color:#F4EEE2;letter-spacing:0.15em;">BESTILLING ${orderId}</span>
    <span style="color:#8A8170;margin:0 12px;">·</span>
    <span style="font-size:13px;color:#8A8170;">${date}</span>
  </td></tr>
  <tr><td style="background:#FBF7EE;padding:32px;">
    <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#8A8170;margin-bottom:10px;">Kundeinformasjon</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4EEE2;border-radius:8px;padding:16px;margin-bottom:28px;">
      <tr><td style="padding:4px 0;font-size:14px;color:#4A4438;width:80px;">Navn</td><td style="padding:4px 0;font-size:14px;font-weight:600;color:#1F1B14;">${customerName || "—"}</td></tr>
      <tr><td style="padding:4px 0;font-size:14px;color:#4A4438;">E-post</td><td style="padding:4px 0;font-size:14px;color:#1F1B14;">${customerEmail || "—"}</td></tr>
      ${customerPhone ? `<tr><td style="padding:4px 0;font-size:14px;color:#4A4438;">Telefon</td><td style="padding:4px 0;font-size:14px;color:#1F1B14;">${customerPhone}</td></tr>` : ""}
      ${deliveryAddress ? `<tr><td style="padding:4px 0;font-size:14px;color:#4A4438;">Adresse</td><td style="padding:4px 0;font-size:14px;color:#1F1B14;">${deliveryAddress}</td></tr>` : ""}
    </table>
    <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#8A8170;margin-bottom:10px;">Bestilte varer</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:8px;overflow:hidden;border:1px solid #ECE4D2;margin-bottom:28px;">
      <thead><tr style="background:#ECE4D2;">
        <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:#8A8170;">Vare</th>
        <th style="padding:10px 14px;text-align:center;font-size:12px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:#8A8170;">Antall</th>
        <th style="padding:10px 14px;text-align:right;font-size:12px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:#8A8170;">Pris</th>
      </tr></thead>
      <tbody>${itemRows}</tbody>
      ${grandTotal > 0 ? `<tfoot><tr style="background:#1F1B14;"><td colspan="2" style="padding:14px;font-size:15px;font-weight:700;color:#FBF7EE;">Estimert totalsum</td><td style="padding:14px;text-align:right;font-size:18px;font-weight:900;color:#FFFFFF;">${grandTotal} kr</td></tr></tfoot>` : ""}
    </table>
    ${notes ? `<div style="margin-bottom:24px;"><div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#8A8170;margin-bottom:10px;">Merknad</div><div style="background:#F0EEFF;border-left:3px solid #9B8FE8;border-radius:6px;padding:14px 16px;font-size:14px;font-style:italic;color:#4A4438;">"${notes}"</div></div>` : ""}
    ${historyRows ? `<div><div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#8A8170;margin-bottom:10px;">Samtalehistorikk</div><div style="background:#F4EEE2;border-radius:8px;padding:16px;">${historyRows}</div></div>` : ""}
  </td></tr>
  <tr><td style="background:#1F1B14;border-radius:0 0 12px 12px;padding:20px 32px;text-align:center;">
    <div style="font-size:12px;color:#8A8170;">Sendt via <span style="color:#D62828;font-weight:700;">MENY</span> AI Bestillingsassistent</div>
    <div style="font-size:11px;color:#4A4438;margin-top:4px;">Prisene er estimerte. Endelig pris bekreftes i kassen.</div>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

// ─── Vercel serverless handler ─────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { cart, customerName, customerEmail, customerPhone, deliveryAddress, notes, chatHistory } = req.body;

    const orderId = genOrderId();
    const date = formatDate();
    const grandTotal = cart.reduce((s, i) => s + (i.price || 0) * i.qty, 0);
    const resendKey = process.env.RESEND_API_KEY;
    const orderEmail = process.env.ORDER_EMAIL || customerEmail;
    const fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev";

    const html = buildEmailHtml({ orderId, date, cart, customerName, customerEmail, customerPhone, deliveryAddress, notes, chatHistory, grandTotal });

    // Demo mode
    if (!resendKey || resendKey === "re_your-key-here") {
      console.log("Demo mode — order:", orderId, "items:", cart.length, "total:", grandTotal, "kr");
      return res.status(200).json({ success: true, orderId, demo: true });
    }

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `MENY Bestilling <${fromEmail}>`,
        to: [orderEmail],
        reply_to: customerEmail || undefined,
        subject: `MENY Bestilling ${orderId} — ${customerName || "Ny bestilling"} — ${grandTotal} kr`,
        html,
      }),
    });

    if (!emailRes.ok) {
      const err = await emailRes.text();
      throw new Error(`Resend error ${emailRes.status}: ${err}`);
    }

    return res.status(200).json({ success: true, orderId });
  } catch (error) {
    console.error("Send order error:", error);
    return res.status(500).json({ error: error.message });
  }
}
