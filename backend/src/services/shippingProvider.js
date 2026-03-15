/**
 * Shipping Provider Abstraction — Phase 1 (Static single provider)
 *
 * GenericShippingProvider makes HTTP calls to a configurable API.
 * When the real delivery company provides their API spec, update the
 * request/response mapping methods to match their contract.
 */
import logger from "../utils/logger.js";

// ─── Base class ──────────────────────────────────────────────────────────────
export class ShippingProvider {
  constructor(config) {
    this.providerName = config.providerName || "generic";
    this.apiBaseUrl = (config.apiBaseUrl || "").replace(/\/+$/, "");
    this.apiKey = config.apiKey || "";
    this.accountId = config.accountId || "";
  }

  /** Create a shipment with the carrier. Returns { externalId, trackingNumber, trackingUrl, estimatedDelivery } */
  async createShipment(/* order, weight */) {
    throw new Error("createShipment() not implemented");
  }

  /** Fetch current tracking status. Returns { carrierStatus, carrierStatusLabel, estimatedDelivery, actualDelivery } */
  async trackShipment(/* trackingNumber */) {
    throw new Error("trackShipment() not implemented");
  }

  /** Cancel an existing shipment. Returns { cancelled: true } */
  async cancelShipment(/* externalId */) {
    throw new Error("cancelShipment() not implemented");
  }

  /** Test API credentials. Returns { valid: true, provider } */
  async validateCredentials() {
    throw new Error("validateCredentials() not implemented");
  }
}

// ─── Generic adapter ─────────────────────────────────────────────────────────
// Makes HTTP calls to configurable endpoints. Designed to be easily remapped
// when the actual delivery company provides their API documentation.
export class GenericShippingProvider extends ShippingProvider {
  constructor(config) {
    super(config);
  }

  /**
   * Build headers for API requests.
   * Override this method to match the delivery company's auth scheme.
   */
  _buildHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
      ...(this.accountId ? { "X-Account-Id": this.accountId } : {}),
    };
  }

  /**
   * Map a ShopFlow order to the delivery company's shipment creation payload.
   * Override this method when integrating with a real provider.
   */
  _mapOrderToShipmentPayload(order, weight) {
    const addr = order.shippingAddress || {};
    return {
      reference: order.orderNumber,
      recipient: {
        name: addr.fullName,
        phone: addr.phone,
        address: addr.street,
        city: addr.city,
        state: addr.state,
        postalCode: addr.postalCode,
        country: addr.country,
      },
      items: (order.items || []).map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      totalAmount: order.totalPrice,
      weight: weight || 1,
      paymentMethod: order.paymentMethod,
      notes: order.notes || "",
    };
  }

  /**
   * Map the delivery company's create-shipment response to ShopFlow format.
   * Override this method when integrating with a real provider.
   */
  _mapCreateResponse(responseData) {
    return {
      externalId: responseData.id || responseData.shipment_id || responseData.externalId || "",
      trackingNumber: responseData.tracking_number || responseData.trackingNumber || "",
      trackingUrl: responseData.tracking_url || responseData.trackingUrl || "",
      estimatedDelivery: responseData.estimated_delivery || responseData.estimatedDelivery || null,
    };
  }

  /**
   * Map the delivery company's tracking response to ShopFlow format.
   * Override this method when integrating with a real provider.
   */
  _mapTrackingResponse(responseData) {
    return {
      carrierStatus: responseData.status || responseData.carrier_status || "",
      carrierStatusLabel: responseData.status_label || responseData.statusLabel || responseData.status || "",
      estimatedDelivery: responseData.estimated_delivery || responseData.estimatedDelivery || null,
      actualDelivery: responseData.actual_delivery || responseData.actualDelivery || null,
    };
  }

  async createShipment(order, weight) {
    const url = `${this.apiBaseUrl}/shipments`;
    const payload = this._mapOrderToShipmentPayload(order, weight);

    const response = await fetch(url, {
      method: "POST",
      headers: this._buildHeaders(),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      logger.error("Shipping createShipment failed:", { status: response.status, body: errorText });
      throw new Error(`Delivery API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return this._mapCreateResponse(data);
  }

  async trackShipment(trackingNumber) {
    const url = `${this.apiBaseUrl}/shipments/track/${encodeURIComponent(trackingNumber)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: this._buildHeaders(),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      logger.error("Shipping trackShipment failed:", { status: response.status, body: errorText });
      throw new Error(`Delivery API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return this._mapTrackingResponse(data);
  }

  async cancelShipment(externalId) {
    const url = `${this.apiBaseUrl}/shipments/${encodeURIComponent(externalId)}/cancel`;

    const response = await fetch(url, {
      method: "POST",
      headers: this._buildHeaders(),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      logger.error("Shipping cancelShipment failed:", { status: response.status, body: errorText });
      throw new Error(`Delivery API error (${response.status}): ${errorText}`);
    }

    return { cancelled: true };
  }

  async validateCredentials() {
    const url = `${this.apiBaseUrl}/auth/validate`;

    const response = await fetch(url, {
      method: "GET",
      headers: this._buildHeaders(),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return { valid: false, provider: this.providerName, error: `HTTP ${response.status}` };
    }

    return { valid: true, provider: this.providerName };
  }
}

/**
 * Factory: create a shipping provider from settings.
 * Returns null if shipping is not enabled or not configured.
 */
export function createShippingProvider(shippingSettings) {
  if (!shippingSettings?.enabled) return null;
  if (!shippingSettings.apiBaseUrl || !shippingSettings.apiKey) return null;

  return new GenericShippingProvider({
    providerName: shippingSettings.providerName || "generic",
    apiBaseUrl: shippingSettings.apiBaseUrl,
    apiKey: shippingSettings.apiKey,
    accountId: shippingSettings.accountId || "",
  });
}
