// ─── HTML escape to prevent XSS in email templates ──────────────────────────
function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─── Shared base layout for all emails ──────────────────────────────────────
function baseLayout(content) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <div style="max-width:600px;margin:0 auto;padding:24px;">
        <div style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="background:#1e293b;padding:20px 24px;">
            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">ShopFlow</h1>
          </div>
          <!-- Content -->
          <div style="padding:24px;">
            ${content}
          </div>
          <!-- Footer -->
          <div style="padding:16px 24px;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">
              &copy; ${new Date().getFullYear()} ShopFlow. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

function primaryButton(url, label) {
  return `
    <a href="${url}"
       style="display:inline-block;padding:12px 24px;background-color:#2563eb;color:#ffffff;
              text-decoration:none;border-radius:6px;margin:16px 0;font-weight:600;font-size:14px;">
      ${label}
    </a>
  `;
}

// ─── Auth Templates ──────────────────────────────────────────────────────────

export function emailVerificationTemplate(name, verificationUrl) {
  const html = baseLayout(`
    <h2 style="color:#1e293b;margin:0 0 12px;">Welcome to ShopFlow, ${esc(name)}!</h2>
    <p style="color:#475569;line-height:1.6;">Please verify your email address to complete your registration.</p>
    ${primaryButton(verificationUrl, "Verify Email Address")}
    <p style="color:#94a3b8;font-size:14px;">This link expires in 24 hours. If you didn't create a ShopFlow account, you can ignore this email.</p>
    <p style="color:#94a3b8;font-size:12px;">Or copy this URL: ${verificationUrl}</p>
  `);

  return {
    subject: "Verify your ShopFlow email address",
    html,
    text: `Welcome to ShopFlow, ${name}!\n\nVerify your email: ${verificationUrl}\n\nLink expires in 24 hours.`,
  };
}

export function passwordResetTemplate(name, resetUrl) {
  const html = baseLayout(`
    <h2 style="color:#1e293b;margin:0 0 12px;">Password Reset Request</h2>
    <p style="color:#475569;line-height:1.6;">Hi ${esc(name)}, we received a request to reset your ShopFlow password.</p>
    ${primaryButton(resetUrl, "Reset Password")}
    <p style="color:#94a3b8;font-size:14px;">This link expires in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
    <p style="color:#94a3b8;font-size:12px;">Or copy this URL: ${resetUrl}</p>
  `);

  return {
    subject: "Reset your ShopFlow password",
    html,
    text: `Hi ${name},\n\nReset your ShopFlow password: ${resetUrl}\n\nLink expires in 15 minutes.`,
  };
}

export function welcomeEmailTemplate(name) {
  const shopUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const html = baseLayout(`
    <h2 style="color:#1e293b;margin:0 0 12px;">Welcome to ShopFlow!</h2>
    <p style="color:#475569;line-height:1.6;">Hi ${esc(name)}, your email has been verified and your account is ready to go.</p>
    <p style="color:#475569;line-height:1.6;">Start browsing our products and enjoy shopping with Cash on Delivery.</p>
    ${primaryButton(shopUrl + "/products", "Start Shopping")}
  `);

  return {
    subject: "Welcome to ShopFlow — Your account is ready!",
    html,
    text: `Hi ${name},\n\nYour ShopFlow account is ready! Start shopping: ${shopUrl}/products`,
  };
}

// ─── Order Templates ─────────────────────────────────────────────────────────

function formatCurrency(amount) {
  return `$${Number(amount).toFixed(2)}`;
}

function orderItemsTable(items) {
  const rows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#334155;">${esc(item.name)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#334155;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#334155;text-align:right;">${formatCurrency(item.price * item.quantity)}</td>
      </tr>`
    )
    .join("");

  return `
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <thead>
        <tr style="background:#f1f5f9;">
          <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:12px;text-transform:uppercase;">Item</th>
          <th style="padding:8px 12px;text-align:center;color:#64748b;font-size:12px;text-transform:uppercase;">Qty</th>
          <th style="padding:8px 12px;text-align:right;color:#64748b;font-size:12px;text-transform:uppercase;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function addressBlock(addr) {
  return `
    <div style="background:#f8fafc;padding:12px 16px;border-radius:6px;margin:12px 0;">
      <p style="margin:0 0 4px;font-weight:600;color:#334155;">${esc(addr.fullName)}</p>
      <p style="margin:0;color:#64748b;font-size:14px;line-height:1.5;">
        ${esc(addr.street)}<br>
        ${esc(addr.city)}, ${esc(addr.state)} ${esc(addr.postalCode)}<br>
        ${esc(addr.country)}<br>
        Phone: ${esc(addr.phone)}
      </p>
    </div>
  `;
}

export function orderConfirmationTemplate(order, customerName) {
  const trackUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard/orders/${order._id || order.id}`;
  const html = baseLayout(`
    <h2 style="color:#1e293b;margin:0 0 12px;">Order Confirmed!</h2>
    <p style="color:#475569;line-height:1.6;">Hi ${esc(customerName)}, thank you for your order.</p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:12px 16px;margin:12px 0;">
      <p style="margin:0;color:#166534;font-weight:600;">Order #${order.orderNumber}</p>
      <p style="margin:4px 0 0;color:#166534;font-size:14px;">Payment: Cash on Delivery (COD)</p>
    </div>
    ${orderItemsTable(order.items)}
    <div style="text-align:right;padding:8px 12px;">
      <p style="margin:0;color:#64748b;font-size:14px;">Shipping: ${formatCurrency(order.shippingCost)}</p>
      <p style="margin:4px 0 0;color:#1e293b;font-size:18px;font-weight:700;">Total: ${formatCurrency(order.totalPrice)}</p>
    </div>
    <h3 style="color:#1e293b;margin:20px 0 8px;font-size:16px;">Delivery Address</h3>
    ${addressBlock(order.shippingAddress)}
    <p style="color:#475569;line-height:1.6;margin-top:16px;">Please keep the exact amount ready for Cash on Delivery.</p>
    ${primaryButton(trackUrl, "Track Your Order")}
  `);

  return {
    subject: `Order Confirmed — #${order.orderNumber}`,
    html,
    text: `Hi ${customerName},\n\nYour order #${order.orderNumber} has been confirmed.\nTotal: ${formatCurrency(order.totalPrice)} (Cash on Delivery)\n\nTrack: ${trackUrl}`,
  };
}

export function orderShippedTemplate(order, customerName) {
  const trackUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard/orders/${order._id || order.id}`;
  const html = baseLayout(`
    <h2 style="color:#1e293b;margin:0 0 12px;">Your Order Has Been Shipped!</h2>
    <p style="color:#475569;line-height:1.6;">Hi ${esc(customerName)}, great news! Your order is on its way.</p>
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:12px 16px;margin:12px 0;">
      <p style="margin:0;color:#1e40af;font-weight:600;">Order #${order.orderNumber}</p>
    </div>
    <h3 style="color:#1e293b;margin:20px 0 8px;font-size:16px;">Delivery Address</h3>
    ${addressBlock(order.shippingAddress)}
    <p style="color:#475569;line-height:1.6;">Please keep ${formatCurrency(order.totalPrice)} ready for Cash on Delivery.</p>
    ${primaryButton(trackUrl, "Track Your Order")}
  `);

  return {
    subject: `Order Shipped — #${order.orderNumber}`,
    html,
    text: `Hi ${customerName},\n\nYour order #${order.orderNumber} has been shipped!\nKeep ${formatCurrency(order.totalPrice)} ready for COD.\n\nTrack: ${trackUrl}`,
  };
}

export function orderDeliveredTemplate(order, customerName) {
  const reviewUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/products`;
  const html = baseLayout(`
    <h2 style="color:#1e293b;margin:0 0 12px;">Order Delivered!</h2>
    <p style="color:#475569;line-height:1.6;">Hi ${esc(customerName)}, your order has been delivered successfully.</p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:12px 16px;margin:12px 0;">
      <p style="margin:0;color:#166534;font-weight:600;">Order #${order.orderNumber} — Delivered</p>
      <p style="margin:4px 0 0;color:#166534;font-size:14px;">Total paid: ${formatCurrency(order.totalPrice)}</p>
    </div>
    <p style="color:#475569;line-height:1.6;">We hope you enjoy your purchase! Consider leaving a review to help other shoppers.</p>
    ${primaryButton(reviewUrl, "Browse More Products")}
  `);

  return {
    subject: `Order Delivered — #${order.orderNumber}`,
    html,
    text: `Hi ${customerName},\n\nYour order #${order.orderNumber} has been delivered!\nTotal: ${formatCurrency(order.totalPrice)}\n\nEnjoy your purchase!`,
  };
}

export function orderCancelledTemplate(order, customerName, cancelledBy) {
  const shopUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/products`;
  const byText = cancelledBy === "admin" ? "by our team" : "as requested";
  const html = baseLayout(`
    <h2 style="color:#1e293b;margin:0 0 12px;">Order Cancelled</h2>
    <p style="color:#475569;line-height:1.6;">Hi ${esc(customerName)}, your order has been cancelled ${byText}.</p>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:12px 16px;margin:12px 0;">
      <p style="margin:0;color:#991b1b;font-weight:600;">Order #${order.orderNumber} — Cancelled</p>
      <p style="margin:4px 0 0;color:#991b1b;font-size:14px;">No payment is required.</p>
    </div>
    ${orderItemsTable(order.items)}
    <p style="color:#475569;line-height:1.6;">If you have questions about this cancellation, please contact our support team.</p>
    ${primaryButton(shopUrl, "Continue Shopping")}
  `);

  return {
    subject: `Order Cancelled — #${order.orderNumber}`,
    html,
    text: `Hi ${customerName},\n\nYour order #${order.orderNumber} has been cancelled ${byText}.\nNo payment is required.\n\nContinue shopping: ${shopUrl}`,
  };
}
