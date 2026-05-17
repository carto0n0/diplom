import { FIELD_RULES, RULE_ALIASES } from "./rules.js";
import { sanitizeValue, buildNextInputValue } from "./sanitize.js";

function getFieldRule(fieldName) {
  return RULE_ALIASES[fieldName] || null;
}

export function handleValidatedInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
  const rule = getFieldRule(target.name || target.id || "");
  if (!rule) return;
  const nextValue = sanitizeValue(target.value, rule);
  if (nextValue !== target.value) target.value = nextValue;
  updateFieldValidity(target);
}

export function handleValidatedBlur(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
  updateFieldValidity(target);
}

export function handleValidatedKeydown(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
  const rule = getFieldRule(target.name || target.id || "");
  const key = typeof event.key === "string" ? event.key : "";
  if (!rule || event.ctrlKey || event.metaKey || event.altKey || key.length !== 1) return;
  const nextValue = buildNextInputValue(target, key);
  const sanitizedNext = sanitizeValue(nextValue, rule);
  if (sanitizedNext === nextValue) return;
  const currentValue = target.value || "";
  const sanitizedCurrent = sanitizeValue(currentValue, rule);
  const sanitizedKey = sanitizeValue(key, rule);
  if (!sanitizedKey || sanitizedNext === sanitizedCurrent) event.preventDefault();
}

export function handleValidatedPaste(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
  const rule = getFieldRule(target.name || target.id || "");
  if (!rule) return;
  const pastedText = event.clipboardData?.getData("text") ?? "";
  const nextValue = buildNextInputValue(target, pastedText);
  const sanitized = sanitizeValue(nextValue, rule);
  if (sanitized === nextValue) return;

  event.preventDefault();
  target.value = sanitized;
  const caret = Math.min(sanitized.length, (target.selectionStart ?? target.value.length) + sanitizeValue(pastedText, rule).length);
  target.setSelectionRange(caret, caret);
  updateFieldValidity(target);
}

export function validateFieldValue(fieldName, value, required = false) {
  const text = String(value || "").trim();
  if (!text && !required) return null;
  if (!text && required) return "Заполните обязательное поле.";

  const validators = {
    fullName: () => /^[\p{L}' -]{2,80}$/u.test(text) ? null : "ФИО содержит недопустимые символы.",
    email: () => /^[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(text) ? null : "Введите корректный email.",
    password: () => /^[^\r\n]{6,24}$/.test(text) ? null : "Пароль должен содержать от 6 до 24 символов.",
    passportId: () => /^[A-Z]{2}\d{7}$/.test(text.toUpperCase()) ? null : "Паспорт должен быть в формате MP1234567.",
    birthDate: () => isBirthDateAllowed(text) ? null : "Дата рождения должна подтверждать возраст от 18 до 99 лет.",
    address: () => /^[\p{L}0-9\s.,\-\/\u2116]{5,120}$/u.test(text) ? null : "Адрес содержит недопустимые символы.",
    topic: () => /^[^<>]{3,120}$/.test(text) ? null : "Тема содержит недопустимые символы.",
    message: () => /^[^<>]{5,300}$/.test(text) ? null : "Сообщение содержит недопустимые символы.",
    title: () => /^[^<>]{3,120}$/.test(text) ? null : "Заголовок содержит недопустимые символы.",
    cardNumber: () => /^\d{16}$/.test(text.replace(/\s/g, "")) ? null : "Номер карты должен содержать 16 цифр.",
    cardHolder: () => /^[A-Z ]{4,40}$/.test(text) ? null : "Имя держателя карты должно быть на латинице.",
    expiry: () => /^(0[1-9]|1[0-2])\/\d{2}$/.test(text) ? null : "Срок действия укажите в формате MM/YY.",
    cvv: () => /^\d{3,4}$/.test(text) ? null : "CVV должен содержать 3 или 4 цифры.",
    amount: () => /^\d+(\.\d{1,2})?$/.test(text) ? null : "Введите корректную сумму.",
    balance: () => /^-?\d+(\.\d{1,2})?$/.test(text) ? null : "Введите корректный баланс."
  };

  const keyMap = {
    fullName: "fullName",
    email: "email",
    password: "password",
    newPassword: "password",
    passportId: "passportId",
    birthDate: "birthDate",
    address: "address",
    topic: "topic",
    supportTopic: "topic",
    title: "title",
    mailingTitle: "title",
    message: "message",
    supportMessage: "message",
    mailingMessage: "message",
    cardNumber: "cardNumber",
    cardHolder: "cardHolder",
    expiry: "expiry",
    cvv: "cvv",
    amount: "amount",
    topupAmount: "amount",
    promiseAmount: "amount",
    balance: "balance"
  };

  const validator = validators[keyMap[fieldName] || fieldName];
  return validator ? validator() : null;
}

function isBirthDateAllowed(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const birthDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return false;
  const today = new Date();
  const minBirthDate = new Date(today.getFullYear() - 99, today.getMonth(), today.getDate());
  const maxBirthDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  return birthDate >= minBirthDate && birthDate <= maxBirthDate;
}

export function applyValidationAttributes(root = document) {
  root.querySelectorAll("input[name], textarea[name], input[id], textarea[id]").forEach((field) => {
    const key = field.name || field.id;
    const config = FIELD_RULES[key];
    if (!config) return;
    if (config.maxLength) field.maxLength = config.maxLength;
    if (config.inputMode) field.inputMode = config.inputMode;
    if (config.pattern) field.pattern = config.pattern;
    if (config.autocomplete) field.autocomplete = config.autocomplete;
    if (config.title) field.title = config.title;
    if (config.type === "date") {
      const today = new Date();
      field.min = `${today.getFullYear() - 99}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      field.max = `${today.getFullYear() - 18}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    }
    if (field.form) field.form.noValidate = true;
  });
}

export function updateFieldValidity(field) {
  const key = field.name || field.id || "";
  field.setCustomValidity(validateFieldValue(key, field.value, field.required) || "");
}

export function assertFields(fields) {
  for (const field of fields) {
    const error = validateFieldValue(field.name, field.value, field.required);
    if (error) throw new Error(error);
  }
}
