export function sanitizeValue(value, rule) {
  const source = String(value || "");
  switch (rule) {
    case "fullName":
      return source.replace(/[^\p{L}' -]/gu, "").replace(/\s{2,}/g, " ").slice(0, 80);
    case "email":
      return source.toLowerCase().replace(/[^a-z0-9@._-]/g, "").slice(0, 80);
    case "password":
      return source.slice(0, 24);
    case "passport":
      return source.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 9);
    case "date":
      return source.replace(/[^\d-]/g, "").slice(0, 10);
    case "address":
      return source.replace(/[^\p{L}0-9\s.,\-\/\u2116]/gu, "").replace(/\s{2,}/g, " ").slice(0, 120);
    case "topic":
    case "title":
      return source.replace(/[<>]/g, "").replace(/\s{2,}/g, " ").slice(0, 120);
    case "message":
      return source.replace(/[<>]/g, "").replace(/[ \t]{2,}/g, " ").slice(0, 300);
    case "cardNumber":
      return formatCardNumber(source);
    case "cardHolder":
      return source.toUpperCase().replace(/[^A-Z\s]/g, "").slice(0, 40);
    case "expiry":
      return formatExpiry(source);
    case "cvv":
      return source.replace(/\D/g, "").slice(0, 3);
    case "amount":
      return normalizeDecimal(source, false, 8);
    case "balance":
      return normalizeDecimal(source, true, 9);
    case "search":
      return source.replace(/[<>]/g, "").replace(/\s{2,}/g, " ").slice(0, 120);
    default:
      return source;
  }
}

export function formatCardNumber(value) {
  return value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

export function formatExpiry(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length < 3) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function normalizeDecimal(value, allowNegative, maxLength) {
  let cleaned = String(value || "").replace(allowNegative ? /[^0-9.-]/g : /[^0-9.]/g, "");
  const negative = allowNegative && cleaned.startsWith("-");
  cleaned = cleaned.replace(/-/g, "");
  const [integerPart, ...rest] = cleaned.split(".");
  const decimals = rest.join("").slice(0, 2);
  let result = integerPart;
  if (rest.length) result += `.${decimals}`;
  if (negative) result = `-${result}`;
  return result.slice(0, maxLength);
}

export function buildNextInputValue(target, insertedText) {
  const currentValue = target.value || "";
  const start = target.selectionStart ?? currentValue.length;
  const end = target.selectionEnd ?? start;
  return `${currentValue.slice(0, start)}${insertedText}${currentValue.slice(end)}`;
}
