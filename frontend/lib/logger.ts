const isDev = process.env.NODE_ENV !== "production";

const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log("[ShopFlow]", ...args); // eslint-disable-line no-console
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn("[ShopFlow]", ...args); // eslint-disable-line no-console
  },
  error: (...args: unknown[]) => {
    if (isDev) console.error("[ShopFlow]", ...args); // eslint-disable-line no-console
  },
};

export default logger;
