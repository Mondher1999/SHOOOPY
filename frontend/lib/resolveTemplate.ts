/**
 * Resolve the active template ID from homepage settings.
 * Shared utility used by all view switchers and themed components.
 */
export function resolveTemplate(
  hp: { template?: string; mode?: string } | undefined
): string {
  if (hp?.template) return hp.template;
  if (hp?.mode === "hardcoded") return "classic";
  if (hp?.mode === "dynamic") return "dynamic";
  return "classic";
}
