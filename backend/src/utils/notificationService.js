import { sendEmail } from "./sendEmail.js";
import {
  getEmailConfig,
  orderConfirmationTemplate,
  orderShippedTemplate,
  orderDeliveredTemplate,
  orderCancelledTemplate,
  welcomeEmailTemplate,
} from "./emailTemplates.js";
import User from "../models/userModel.js";
import logger from "./logger.js";

/**
 * Sends an order-lifecycle email notification.
 * Non-blocking — errors are logged, never thrown to the caller.
 *
 * @param {"placed"|"shipped"|"delivered"|"cancelled"} event
 * @param {Object} order — full order document (with items, shippingAddress, etc.)
 * @param {Object} [options]
 * @param {"customer"|"admin"} [options.cancelledBy] — who triggered the cancellation
 */
export async function sendOrderNotification(event, order, options = {}) {
  try {
    // Resolve the customer — include language preference for bilingual emails
    const user = await User.findById(order.user).select("name email language").lean();
    if (!user || !user.email) {
      logger.warn(`Cannot send ${event} email — user not found for order ${order.orderNumber}`);
      return;
    }

    const lang = user.language || "en";
    const emailConfig = await getEmailConfig();

    let template;
    switch (event) {
      case "placed":
        template = orderConfirmationTemplate(order, user.name, emailConfig, lang);
        break;
      case "shipped":
        template = orderShippedTemplate(order, user.name, emailConfig, lang);
        break;
      case "delivered":
        template = orderDeliveredTemplate(order, user.name, emailConfig, lang);
        break;
      case "cancelled":
        template = orderCancelledTemplate(order, user.name, options.cancelledBy || "customer", emailConfig, lang);
        break;
      default:
        logger.warn(`Unknown order notification event: ${event}`);
        return;
    }

    await sendEmail({ to: user.email, ...template });
    logger.info(`Order ${event} email sent for ${order.orderNumber} to ${user.email} [lang=${lang}]`);
  } catch (error) {
    // Non-blocking — log and continue
    logger.error(`Failed to send ${event} email for order ${order.orderNumber}:`, error.message);
  }
}

/**
 * Sends a welcome email after email verification.
 * Non-blocking — errors are logged, never thrown to the caller.
 *
 * @param {Object} user — { name, email, language? }
 */
export async function sendWelcomeEmail(user) {
  try {
    if (!user || !user.email) {
      logger.warn("Cannot send welcome email — missing user or email");
      return;
    }

    const lang = user.language || "en";
    const emailConfig = await getEmailConfig();
    const template = welcomeEmailTemplate(user.name, emailConfig, lang);
    await sendEmail({ to: user.email, ...template });
    logger.info(`Welcome email sent to ${user.email} [lang=${lang}]`);
  } catch (error) {
    logger.error(`Failed to send welcome email to ${user.email}:`, error.message);
  }
}
