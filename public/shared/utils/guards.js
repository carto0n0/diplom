export function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

export function ensureObject(value) {
  return value && typeof value === "object" ? value : {};
}
