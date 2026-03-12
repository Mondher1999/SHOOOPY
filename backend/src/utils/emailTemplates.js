import cache from "./cache.js";

const DEFAULT_SHOP_NAME = "ShopFlow";

// ─── Resolve shop name + customizable subjects from settings ─────────────────
export async function getEmailConfig() {
  const cached = cache.get("settings:global");
  if (cached?.store?.name) {
    return {
      shopName: cached.store.name,
      subjects: cached.emailTemplates || {},
      currency: cached.store?.currency || "USD",
    };
  }

  try {
    const { default: Settings } = await import("../models/settingsModel.js");
    const raw = await Settings.findOne({}).select("store.name store.currency emailTemplates").lean();
    return {
      shopName: raw?.store?.name || DEFAULT_SHOP_NAME,
      subjects: raw?.emailTemplates || {},
      currency: raw?.store?.currency || "USD",
    };
  } catch {
    return { shopName: DEFAULT_SHOP_NAME, subjects: {}, currency: "USD" };
  }
}

export async function getShopName() {
  const config = await getEmailConfig();
  return config.shopName;
}

// ─── Interpolate {{placeholders}} in subject templates ───────────────────────
function interpolateSubject(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}

// ─── HTML escape to prevent XSS in email templates ──────────────────────────
function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─── i18n strings for all email copy ─────────────────────────────────────────
const STRINGS = {
  en: {
    rightsReserved: "All rights reserved.",
    questionsContact: "Questions? Contact our support team.",
    autoEmail: "This is an automated message — please do not reply directly to this email.",
    // Auth
    verifySubject: (shop) => `Verify your email — ${shop}`,
    verifyHeading: (shop, name) => `Welcome to ${shop}, ${name}!`,
    verifyBody: "Please verify your email address to complete your registration and start shopping.",
    verifyBtn: "Verify My Email",
    verifyExpiry: "This link expires in 24 hours.",
    verifyIgnore: (shop) => `If you didn't create a ${shop} account, you can safely ignore this email.`,
    verifyCopy: "Or copy this link:",
    // Password reset
    resetSubject: (shop) => `Reset your password — ${shop}`,
    resetHeading: "Password Reset Request",
    resetBody: (name) => `Hi ${name}, we received a request to reset your ${DEFAULT_SHOP_NAME} account password.`,
    resetBtn: "Reset My Password",
    resetExpiry: "This link expires in 15 minutes.",
    resetIgnore: "If you didn't request this, you can safely ignore this email — your password won't change.",
    resetCopy: "Or copy this link:",
    // Welcome
    welcomeSubject: (shop) => `Welcome to ${shop} — Your account is ready!`,
    welcomeHeading: (shop) => `You're all set, welcome to ${shop}!`,
    welcomeBody: "Your email has been verified and your account is ready to use.",
    welcomeBody2: "Browse our products and enjoy the convenience of Cash on Delivery — pay when your order arrives.",
    welcomeBtn: "Start Shopping",
    // Order confirmation
    orderConfSubject: (num) => `Order Confirmed — #${num}`,
    orderConfHeading: "Order Confirmed!",
    orderConfBody: (name) => `Hi ${name}, thank you for your order. We've received it and will process it shortly.`,
    orderConfBadgeTitle: (num) => `Order #${num}`,
    orderConfBadgeSub: "Payment: Cash on Delivery (COD)",
    orderConfItemCol: "Item",
    orderConfQtyCol: "Qty",
    orderConfTotalCol: "Total",
    orderConfShipping: "Shipping",
    orderConfGrandTotal: "Grand Total",
    orderConfAddrHeading: "Delivery Address",
    orderConfCodNote: "Please prepare the exact amount in cash for delivery.",
    orderConfBtn: "Track My Order",
    orderConfPhone: "Phone",
    // Order shipped
    orderShippedSubject: (num) => `Your order is on its way — #${num}`,
    orderShippedHeading: "Your Order Has Shipped!",
    orderShippedBody: (name) => `Great news, ${name}! Your order is on its way to you.`,
    orderShippedBadgeTitle: (num) => `Order #${num}`,
    orderShippedAddrHeading: "Delivery Address",
    orderShippedCodNote: (amount) => `Please prepare ${amount} in cash for the delivery driver.`,
    orderShippedBtn: "Track My Order",
    // Order delivered
    orderDeliveredSubject: (num) => `Order Delivered — #${num}`,
    orderDeliveredHeading: "Order Delivered!",
    orderDeliveredBody: (name) => `Great news, ${name}! Your order has been successfully delivered.`,
    orderDeliveredBadgeTitle: (num) => `Order #${num} — Delivered`,
    orderDeliveredBadgeSub: (amount) => `Total paid: ${amount}`,
    orderDeliveredThanks: "We hope you love your purchase! Feel free to leave a review to help other shoppers.",
    orderDeliveredBtn: "Discover More Products",
    // Order cancelled
    orderCancelledSubject: (num) => `Order Cancelled — #${num}`,
    orderCancelledHeading: "Order Cancelled",
    orderCancelledByAdmin: "by our team",
    orderCancelledByCustomer: "at your request",
    orderCancelledBody: (name, by) => `Hi ${name}, your order has been cancelled ${by}.`,
    orderCancelledBadgeTitle: (num) => `Order #${num} — Cancelled`,
    orderCancelledBadgeSub: "No payment is required.",
    orderCancelledNote: "If you have questions about this cancellation, please contact our support team.",
    orderCancelledBtn: "Continue Shopping",
  },
  fr: {
    rightsReserved: "Tous droits réservés.",
    questionsContact: "Des questions ? Contactez notre équipe support.",
    autoEmail: "Cet e-mail est automatique — merci de ne pas y répondre directement.",
    // Auth
    verifySubject: (shop) => `Vérifiez votre adresse e-mail — ${shop}`,
    verifyHeading: (shop, name) => `Bienvenue sur ${shop}, ${name} !`,
    verifyBody: "Veuillez vérifier votre adresse e-mail pour finaliser votre inscription et commencer à magasiner.",
    verifyBtn: "Vérifier mon adresse e-mail",
    verifyExpiry: "Ce lien expire dans 24 heures.",
    verifyIgnore: (shop) => `Si vous n'avez pas créé de compte ${shop}, vous pouvez ignorer cet e-mail.`,
    verifyCopy: "Ou copiez ce lien :",
    // Password reset
    resetSubject: (shop) => `Réinitialisez votre mot de passe — ${shop}`,
    resetHeading: "Demande de réinitialisation du mot de passe",
    resetBody: (name) => `Bonjour ${name}, nous avons reçu une demande de réinitialisation du mot de passe de votre compte.`,
    resetBtn: "Réinitialiser mon mot de passe",
    resetExpiry: "Ce lien expire dans 15 minutes.",
    resetIgnore: "Si vous n'avez pas effectué cette demande, ignorez cet e-mail — votre mot de passe restera inchangé.",
    resetCopy: "Ou copiez ce lien :",
    // Welcome
    welcomeSubject: (shop) => `Bienvenue sur ${shop} — Votre compte est prêt !`,
    welcomeHeading: (shop) => `Tout est prêt, bienvenue sur ${shop} !`,
    welcomeBody: "Votre adresse e-mail a été vérifiée et votre compte est maintenant actif.",
    welcomeBody2: "Parcourez nos produits et profitez du paiement à la livraison — payez uniquement à la réception.",
    welcomeBtn: "Commencer mes achats",
    // Order confirmation
    orderConfSubject: (num) => `Commande confirmée — #${num}`,
    orderConfHeading: "Commande confirmée !",
    orderConfBody: (name) => `Bonjour ${name}, merci pour votre commande. Nous l'avons reçue et la traiterons très prochainement.`,
    orderConfBadgeTitle: (num) => `Commande #${num}`,
    orderConfBadgeSub: "Paiement : Contre remboursement (COD)",
    orderConfItemCol: "Article",
    orderConfQtyCol: "Qté",
    orderConfTotalCol: "Total",
    orderConfShipping: "Livraison",
    orderConfGrandTotal: "Total général",
    orderConfAddrHeading: "Adresse de livraison",
    orderConfCodNote: "Veuillez préparer le montant exact en espèces pour la livraison.",
    orderConfBtn: "Suivre ma commande",
    orderConfPhone: "Tél.",
    // Order shipped
    orderShippedSubject: (num) => `Votre commande est en route — #${num}`,
    orderShippedHeading: "Votre commande a été expédiée !",
    orderShippedBody: (name) => `Bonne nouvelle, ${name} ! Votre commande est en route vers vous.`,
    orderShippedBadgeTitle: (num) => `Commande #${num}`,
    orderShippedAddrHeading: "Adresse de livraison",
    orderShippedCodNote: (amount) => `Veuillez préparer ${amount} en espèces pour le livreur.`,
    orderShippedBtn: "Suivre ma commande",
    // Order delivered
    orderDeliveredSubject: (num) => `Commande livrée — #${num}`,
    orderDeliveredHeading: "Commande livrée !",
    orderDeliveredBody: (name) => `Excellente nouvelle, ${name} ! Votre commande a été livrée avec succès.`,
    orderDeliveredBadgeTitle: (num) => `Commande #${num} — Livrée`,
    orderDeliveredBadgeSub: (amount) => `Total payé : ${amount}`,
    orderDeliveredThanks: "Nous espérons que vous apprécierez votre achat ! N'hésitez pas à laisser un avis pour aider les autres acheteurs.",
    orderDeliveredBtn: "Découvrir plus de produits",
    // Order cancelled
    orderCancelledSubject: (num) => `Commande annulée — #${num}`,
    orderCancelledHeading: "Commande annulée",
    orderCancelledByAdmin: "par notre équipe",
    orderCancelledByCustomer: "à votre demande",
    orderCancelledBody: (name, by) => `Bonjour ${name}, votre commande a été annulée ${by}.`,
    orderCancelledBadgeTitle: (num) => `Commande #${num} — Annulée`,
    orderCancelledBadgeSub: "Aucun paiement n'est requis.",
    orderCancelledNote: "Si vous avez des questions concernant cette annulation, veuillez contacter notre équipe support.",
    orderCancelledBtn: "Continuer mes achats",
  },
};

function getStrings(lang) {
  return STRINGS[lang] || STRINGS.en;
}

// ─── Format currency ─────────────────────────────────────────────────────────
function formatCurrency(amount, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(Number(amount));
  } catch {
    return `${Number(amount).toFixed(2)} ${currency}`;
  }
}

// ─── SVG Icons (inline, email-safe) ──────────────────────────────────────────
const ICONS = {
  checkCircle: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto 16px;">
    <circle cx="12" cy="12" r="12" fill="#dcfce7"/>
    <path d="M7 12.5l3.5 3.5 6.5-7" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  mailCheck: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto 16px;">
    <circle cx="12" cy="12" r="12" fill="#dbeafe"/>
    <rect x="4" y="7" width="16" height="12" rx="2" stroke="#2563eb" stroke-width="1.5" fill="none"/>
    <path d="M4 9l8 5 8-5" stroke="#2563eb" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M14 16l2 2 4-4" stroke="#16a34a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  lock: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto 16px;">
    <circle cx="12" cy="12" r="12" fill="#fef3c7"/>
    <rect x="7" y="11" width="10" height="7" rx="1.5" stroke="#d97706" stroke-width="1.5" fill="none"/>
    <path d="M9 11V8.5a3 3 0 016 0V11" stroke="#d97706" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="12" cy="14.5" r="1" fill="#d97706"/>
  </svg>`,
  star: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto 16px;">
    <circle cx="12" cy="12" r="12" fill="#dcfce7"/>
    <path d="M12 6l1.5 4.5H18l-3.75 2.75 1.5 4.5L12 15.25 8.25 17.75l1.5-4.5L6 10.5h4.5L12 6z" fill="#16a34a"/>
  </svg>`,
  truck: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto 16px;">
    <circle cx="12" cy="12" r="12" fill="#dbeafe"/>
    <path d="M3 10h9V6H3v4zM12 10h3l3 3v3h-6v-6z" stroke="#2563eb" stroke-width="1.5" fill="none" stroke-linejoin="round"/>
    <circle cx="6.5" cy="16.5" r="1.5" stroke="#2563eb" stroke-width="1.5" fill="none"/>
    <circle cx="16.5" cy="16.5" r="1.5" stroke="#2563eb" stroke-width="1.5" fill="none"/>
  </svg>`,
  xCircle: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto 16px;">
    <circle cx="12" cy="12" r="12" fill="#fee2e2"/>
    <path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke="#dc2626" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
};

// ─── Status badge ─────────────────────────────────────────────────────────────
// type: "success" | "info" | "warning" | "error"
function statusBadge(title, subtitle, type = "success") {
  const styles = {
    success: { bg: "#f0fdf4", border: "#bbf7d0", title: "#14532d", sub: "#166534" },
    info:    { bg: "#eff6ff", border: "#bfdbfe", title: "#1e3a8a", sub: "#1e40af" },
    warning: { bg: "#fffbeb", border: "#fde68a", title: "#78350f", sub: "#92400e" },
    error:   { bg: "#fef2f2", border: "#fecaca", title: "#7f1d1d", sub: "#991b1b" },
  };
  const s = styles[type] || styles.info;
  return `
    <div style="background:${s.bg};border:1px solid ${s.border};border-left:4px solid ${s.border};border-radius:8px;padding:14px 18px;margin:16px 0;">
      <p style="margin:0;color:${s.title};font-weight:700;font-size:15px;">${title}</p>
      ${subtitle ? `<p style="margin:5px 0 0;color:${s.sub};font-size:13px;">${subtitle}</p>` : ""}
    </div>
  `;
}

// ─── Primary CTA button ───────────────────────────────────────────────────────
function primaryButton(url, label) {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px auto;">
      <tr>
        <td style="border-radius:8px;background:#0369a1;">
          <a href="${esc(url)}"
             style="display:inline-block;padding:14px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;letter-spacing:0.3px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>
  `;
}

// ─── Divider ──────────────────────────────────────────────────────────────────
function divider() {
  return `<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">`;
}

// ─── Order items table ────────────────────────────────────────────────────────
function orderItemsTable(items, s, currency = "USD") {
  const rows = items.map((item) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#334155;font-size:14px;line-height:1.4;">${esc(item.name)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#334155;text-align:center;font-size:14px;white-space:nowrap;">× ${item.quantity}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#0f172a;text-align:right;font-size:14px;font-weight:600;white-space:nowrap;">${formatCurrency(item.price * item.quantity, currency)}</td>
    </tr>`).join("");

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin:16px 0;">
      <thead>
        <tr style="background:#f8fafc;">
          <th style="padding:10px 12px;text-align:left;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;">${s.orderConfItemCol}</th>
          <th style="padding:10px 12px;text-align:center;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;">${s.orderConfQtyCol}</th>
          <th style="padding:10px 12px;text-align:right;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;">${s.orderConfTotalCol}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// ─── Order totals block ───────────────────────────────────────────────────────
function orderTotals(order, s, currency = "USD") {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin:0 0 8px;">
      <tr>
        <td style="padding:4px 12px;color:#64748b;font-size:14px;text-align:right;">${s.orderConfShipping}</td>
        <td style="padding:4px 12px;color:#334155;font-size:14px;text-align:right;font-weight:500;">${formatCurrency(order.shippingCost, currency)}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px 4px;color:#0f172a;font-size:16px;font-weight:700;text-align:right;">${s.orderConfGrandTotal}</td>
        <td style="padding:8px 12px 4px;color:#0369a1;font-size:18px;font-weight:800;text-align:right;">${formatCurrency(order.totalPrice, currency)}</td>
      </tr>
    </table>
  `;
}

// ─── Address block ────────────────────────────────────────────────────────────
function addressBlock(addr, phoneLabel) {
  return `
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 18px;margin:12px 0;">
      <p style="margin:0 0 6px;font-weight:700;color:#0f172a;font-size:14px;">${esc(addr.fullName)}</p>
      <p style="margin:0;color:#475569;font-size:13px;line-height:1.7;">
        ${esc(addr.street)}<br>
        ${esc(addr.city)}${addr.state ? `, ${esc(addr.state)}` : ""} ${esc(addr.postalCode)}<br>
        ${esc(addr.country)}<br>
        ${phoneLabel}: ${esc(addr.phone)}
      </p>
    </div>
  `;
}

// ─── Shared base layout ───────────────────────────────────────────────────────
function baseLayout(content, shopName = DEFAULT_SHOP_NAME, lang = "en") {
  const s = getStrings(lang);
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="${lang}" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${esc(shopName)}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style type="text/css">
    body { margin:0!important; padding:0!important; background-color:#f1f5f9!important; }
    @media only screen and (max-width:600px) {
      .email-container { width:100%!important; }
      .content-cell { padding:24px 16px!important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <!-- Outer wrapper -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <!-- Email container -->
        <table role="presentation" class="email-container" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;width:100%;">

          <!-- ═══ HEADER ═══ -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);border-radius:12px 12px 0 0;padding:28px 36px;" align="center">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <p style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">${esc(shopName)}</p>
                    <p style="margin:3px 0 0;font-size:12px;color:#93c5fd;letter-spacing:1.5px;text-transform:uppercase;">Official Store</p>
                  </td>
                  <td align="right">
                    <div style="width:40px;height:40px;background:rgba(255,255,255,0.12);border-radius:8px;display:inline-block;line-height:40px;text-align:center;">
                      <span style="font-size:20px;line-height:40px;display:inline-block;">&#128722;</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ═══ BODY ═══ -->
          <tr>
            <td style="background:#ffffff;padding:36px 36px 28px;" class="content-cell">
              ${content}
            </td>
          </tr>

          <!-- ═══ FOOTER ═══ -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;border-radius:0 0 12px 12px;padding:20px 36px;" align="center">
              <p style="margin:0 0 6px;color:#64748b;font-size:12px;">${s.questionsContact}</p>
              <p style="margin:0 0 6px;color:#94a3b8;font-size:11px;font-style:italic;">${s.autoEmail}</p>
              <p style="margin:8px 0 0;color:#94a3b8;font-size:11px;">&copy; ${year} ${esc(shopName)}. ${s.rightsReserved}</p>
            </td>
          </tr>

        </table>
        <!-- /Email container -->
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

export function emailVerificationTemplate(name, verificationUrl, config = {}, lang = "en") {
  const shopName = config.shopName || DEFAULT_SHOP_NAME;
  const subjects = config.subjects || {};
  const s = getStrings(lang);

  const subject = subjects.verificationSubject
    ? interpolateSubject(subjects.verificationSubject, { shopName })
    : s.verifySubject(shopName);

  const html = baseLayout(`
    ${ICONS.mailCheck}
    <h1 style="margin:0 0 8px;color:#0f172a;font-size:22px;font-weight:800;text-align:center;line-height:1.3;">${s.verifyHeading(shopName, esc(name))}</h1>
    <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.7;text-align:center;">${s.verifyBody}</p>
    <div style="text-align:center;">
      ${primaryButton(verificationUrl, s.verifyBtn)}
    </div>
    ${divider()}
    <p style="margin:0 0 6px;color:#64748b;font-size:13px;line-height:1.6;">${s.verifyExpiry}</p>
    <p style="margin:0 0 16px;color:#64748b;font-size:13px;line-height:1.6;">${s.verifyIgnore(shopName)}</p>
    <p style="margin:0 0 4px;color:#94a3b8;font-size:12px;">${s.verifyCopy}</p>
    <p style="margin:0;font-size:11px;word-break:break-all;"><a href="${esc(verificationUrl)}" style="color:#0369a1;text-decoration:none;">${esc(verificationUrl)}</a></p>
  `, shopName, lang);

  return {
    subject,
    html,
    text: `${s.verifyHeading(shopName, name)}\n\n${s.verifyBody}\n\n${verificationUrl}\n\n${s.verifyExpiry}`,
  };
}

export function passwordResetTemplate(name, resetUrl, config = {}, lang = "en") {
  const shopName = config.shopName || DEFAULT_SHOP_NAME;
  const subjects = config.subjects || {};
  const s = getStrings(lang);

  const subject = subjects.passwordResetSubject
    ? interpolateSubject(subjects.passwordResetSubject, { shopName })
    : s.resetSubject(shopName);

  const html = baseLayout(`
    ${ICONS.lock}
    <h1 style="margin:0 0 8px;color:#0f172a;font-size:22px;font-weight:800;text-align:center;line-height:1.3;">${s.resetHeading}</h1>
    <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.7;text-align:center;">${s.resetBody(esc(name))}</p>
    <div style="text-align:center;">
      ${primaryButton(resetUrl, s.resetBtn)}
    </div>
    ${divider()}
    <p style="margin:0 0 6px;color:#64748b;font-size:13px;line-height:1.6;">${s.resetExpiry}</p>
    <p style="margin:0 0 16px;color:#64748b;font-size:13px;line-height:1.6;">${s.resetIgnore}</p>
    <p style="margin:0 0 4px;color:#94a3b8;font-size:12px;">${s.resetCopy}</p>
    <p style="margin:0;font-size:11px;word-break:break-all;"><a href="${esc(resetUrl)}" style="color:#0369a1;text-decoration:none;">${esc(resetUrl)}</a></p>
  `, shopName, lang);

  return {
    subject,
    html,
    text: `${s.resetHeading}\n\n${s.resetBody(name)}\n\n${resetUrl}\n\n${s.resetExpiry}`,
  };
}

export function welcomeEmailTemplate(name, config = {}, lang = "en") {
  const shopName = config.shopName || DEFAULT_SHOP_NAME;
  const subjects = config.subjects || {};
  const shopUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const s = getStrings(lang);

  const subject = subjects.welcomeSubject
    ? interpolateSubject(subjects.welcomeSubject, { shopName })
    : s.welcomeSubject(shopName);

  const html = baseLayout(`
    ${ICONS.star}
    <h1 style="margin:0 0 8px;color:#0f172a;font-size:22px;font-weight:800;text-align:center;line-height:1.3;">${s.welcomeHeading(esc(shopName))}</h1>
    <p style="margin:0 0 10px;color:#475569;font-size:15px;line-height:1.7;text-align:center;">${s.welcomeBody}</p>
    <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.7;text-align:center;">${s.welcomeBody2}</p>
    <div style="text-align:center;">
      ${primaryButton(shopUrl + "/products", s.welcomeBtn)}
    </div>
  `, shopName, lang);

  return {
    subject,
    html,
    text: `${s.welcomeHeading(shopName)}\n\n${s.welcomeBody}\n${s.welcomeBody2}\n\n${shopUrl}/products`,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ORDER TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

export function orderConfirmationTemplate(order, customerName, config = {}, lang = "en") {
  const shopName = config.shopName || DEFAULT_SHOP_NAME;
  const subjects = config.subjects || {};
  const currency = config.currency || "USD";
  const trackUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard/orders/${order._id || order.id}`;
  const s = getStrings(lang);

  const subject = subjects.orderConfirmationSubject
    ? interpolateSubject(subjects.orderConfirmationSubject, { shopName, orderNumber: order.orderNumber })
    : s.orderConfSubject(order.orderNumber);

  const html = baseLayout(`
    ${ICONS.checkCircle}
    <h1 style="margin:0 0 8px;color:#0f172a;font-size:22px;font-weight:800;text-align:center;">${s.orderConfHeading}</h1>
    <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.7;text-align:center;">${s.orderConfBody(esc(customerName))}</p>
    ${statusBadge(s.orderConfBadgeTitle(order.orderNumber), s.orderConfBadgeSub, "success")}
    ${orderItemsTable(order.items, s, currency)}
    ${orderTotals(order, s, currency)}
    ${divider()}
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:16px;font-weight:700;">${s.orderConfAddrHeading}</h2>
    ${addressBlock(order.shippingAddress, s.orderConfPhone)}
    <p style="margin:16px 0 0;color:#475569;font-size:14px;line-height:1.6;">${s.orderConfCodNote}</p>
    <div style="text-align:center;">
      ${primaryButton(trackUrl, s.orderConfBtn)}
    </div>
  `, shopName, lang);

  return {
    subject,
    html,
    text: `${s.orderConfHeading}\n\n${s.orderConfBody(customerName)}\n${s.orderConfBadgeTitle(order.orderNumber)}\n${s.orderConfBadgeSub}\n\n${s.orderConfGrandTotal}: ${formatCurrency(order.totalPrice, currency)}\n\n${trackUrl}`,
  };
}

export function orderShippedTemplate(order, customerName, config = {}, lang = "en") {
  const shopName = config.shopName || DEFAULT_SHOP_NAME;
  const subjects = config.subjects || {};
  const currency = config.currency || "USD";
  const trackUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard/orders/${order._id || order.id}`;
  const s = getStrings(lang);

  const subject = subjects.orderShippedSubject
    ? interpolateSubject(subjects.orderShippedSubject, { shopName, orderNumber: order.orderNumber })
    : s.orderShippedSubject(order.orderNumber);

  const html = baseLayout(`
    ${ICONS.truck}
    <h1 style="margin:0 0 8px;color:#0f172a;font-size:22px;font-weight:800;text-align:center;">${s.orderShippedHeading}</h1>
    <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.7;text-align:center;">${s.orderShippedBody(esc(customerName))}</p>
    ${statusBadge(s.orderShippedBadgeTitle(order.orderNumber), null, "info")}
    <h2 style="margin:20px 0 8px;color:#0f172a;font-size:16px;font-weight:700;">${s.orderShippedAddrHeading}</h2>
    ${addressBlock(order.shippingAddress, s.orderConfPhone)}
    <p style="margin:16px 0 0;color:#475569;font-size:14px;line-height:1.6;">${s.orderShippedCodNote(formatCurrency(order.totalPrice, currency))}</p>
    <div style="text-align:center;">
      ${primaryButton(trackUrl, s.orderShippedBtn)}
    </div>
  `, shopName, lang);

  return {
    subject,
    html,
    text: `${s.orderShippedHeading}\n\n${s.orderShippedBody(customerName)}\n${s.orderShippedBadgeTitle(order.orderNumber)}\n\n${s.orderShippedCodNote(formatCurrency(order.totalPrice, currency))}\n\n${trackUrl}`,
  };
}

export function orderDeliveredTemplate(order, customerName, config = {}, lang = "en") {
  const shopName = config.shopName || DEFAULT_SHOP_NAME;
  const subjects = config.subjects || {};
  const currency = config.currency || "USD";
  const reviewUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/products`;
  const s = getStrings(lang);

  const subject = subjects.orderDeliveredSubject
    ? interpolateSubject(subjects.orderDeliveredSubject, { shopName, orderNumber: order.orderNumber })
    : s.orderDeliveredSubject(order.orderNumber);

  const html = baseLayout(`
    ${ICONS.checkCircle}
    <h1 style="margin:0 0 8px;color:#0f172a;font-size:22px;font-weight:800;text-align:center;">${s.orderDeliveredHeading}</h1>
    <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.7;text-align:center;">${s.orderDeliveredBody(esc(customerName))}</p>
    ${statusBadge(s.orderDeliveredBadgeTitle(order.orderNumber), s.orderDeliveredBadgeSub(formatCurrency(order.totalPrice, currency)), "success")}
    <p style="margin:16px 0 0;color:#475569;font-size:14px;line-height:1.6;">${s.orderDeliveredThanks}</p>
    <div style="text-align:center;">
      ${primaryButton(reviewUrl, s.orderDeliveredBtn)}
    </div>
  `, shopName, lang);

  return {
    subject,
    html,
    text: `${s.orderDeliveredHeading}\n\n${s.orderDeliveredBody(customerName)}\n${s.orderDeliveredBadgeTitle(order.orderNumber)}\n${s.orderDeliveredBadgeSub(formatCurrency(order.totalPrice, currency))}\n\n${s.orderDeliveredThanks}`,
  };
}

export function orderCancelledTemplate(order, customerName, cancelledBy, config = {}, lang = "en") {
  const shopName = config.shopName || DEFAULT_SHOP_NAME;
  const subjects = config.subjects || {};
  const currency = config.currency || "USD";
  const shopUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/products`;
  const s = getStrings(lang);

  const byText = cancelledBy === "admin" ? s.orderCancelledByAdmin : s.orderCancelledByCustomer;

  const subject = subjects.orderCancelledSubject
    ? interpolateSubject(subjects.orderCancelledSubject, { shopName, orderNumber: order.orderNumber })
    : s.orderCancelledSubject(order.orderNumber);

  const html = baseLayout(`
    ${ICONS.xCircle}
    <h1 style="margin:0 0 8px;color:#0f172a;font-size:22px;font-weight:800;text-align:center;">${s.orderCancelledHeading}</h1>
    <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.7;text-align:center;">${s.orderCancelledBody(esc(customerName), byText)}</p>
    ${statusBadge(s.orderCancelledBadgeTitle(order.orderNumber), s.orderCancelledBadgeSub, "error")}
    ${orderItemsTable(order.items, s, currency)}
    <p style="margin:12px 0 0;color:#64748b;font-size:14px;line-height:1.6;">${s.orderCancelledNote}</p>
    <div style="text-align:center;">
      ${primaryButton(shopUrl, s.orderCancelledBtn)}
    </div>
  `, shopName, lang);

  return {
    subject,
    html,
    text: `${s.orderCancelledHeading}\n\n${s.orderCancelledBody(customerName, byText)}\n${s.orderCancelledBadgeTitle(order.orderNumber)}\n${s.orderCancelledBadgeSub}\n\n${s.orderCancelledNote}`,
  };
}
