import { sendEmail } from "./sendEmail.js";
import {
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
    // Resolve the customer email
    const user = await User.findById(order.user).select("name email").lean();
    if (!user || !user.email) {
      logger.warn(`Cannot send ${event} email — user not found for order ${order.orderNumber}`);
      return;
    }

    let template;
    switch (event) {
      case "placed":
        template = orderConfirmationTemplate(order, user.name);
        break;
      case "shipped":
        template = orderShippedTemplate(order, user.name);
        break;
      case "delivered":
        template = orderDeliveredTemplate(order, user.name);
        break;
      case "cancelled":
        template = orderCancelledTemplate(order, user.name, options.cancelledBy || "customer");
        break;
      default:
        logger.warn(`Unknown order notification event: ${event}`);
        return;
    }

    await sendEmail({ to: user.email, ...template });
    logger.info(`Order ${event} email sent for ${order.orderNumber} to ${user.email}`);
  } catch (error) {
    // Non-blocking — log and continue
    logger.error(`Failed to send ${event} email for order ${order.orderNumber}:`, error.message);
  }
}

/**
 * Sends a welcome email after email verification.
 * Non-blocking — errors are logged, never thrown to the caller.
 *
 * @param {Object} user — { name, email }
 */
export async function sendWelcomeEmail(user) {
  try {
    if (!user || !user.email) {
      logger.warn("Cannot send welcome email — missing user or email");
      return;
    }

    const template = welcomeEmailTemplate(user.name);
    await sendEmail({ to: user.email, ...template });
    logger.info(`Welcome email sent to ${user.email}`);
  } catch (error) {
    logger.error(`Failed to send welcome email to ${user.email}:`, error.message);
  }
}
