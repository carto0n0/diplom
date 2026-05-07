const state = {
  token: localStorage.getItem("vmc_token") || "",
  rememberedEmail: localStorage.getItem("vmc_email") || "",
  rememberedPassword: localStorage.getItem("vmc_password") || "",
  user: null,
  meta: { tariffs: [], services: [], promotions: [], tickets: [], mailingHistory: [], clients: [] },
  activeTab: "overview",
  adminSort: { key: "balance", direction: "asc" },
  adminSearch: ""
};

const authView = document.getElementById("authView");
const dashboardView = document.getElementById("dashboardView");
const dashboardContent = document.getElementById("dashboardContent");
const sidebarTabs = document.getElementById("sidebarTabs");
const flashMessage = document.getElementById("flashMessage");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const roleBadge = document.getElementById("roleBadge");
const welcomeTitle = document.getElementById("welcomeTitle");
const modalRoot = document.getElementById("modalRoot");
const modalEyebrow = document.getElementById("modalEyebrow");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const toastStack = document.getElementById("toastStack");

const FIELD_RULES = {
  fullName: { type: "fullName", maxLength: 80, pattern: "[\\p{L}' -]{2,80}", title: "Используйте только буквы, пробел, дефис и апостроф." },
  regName: { type: "fullName", maxLength: 80, pattern: "[\\p{L}' -]{2,80}", title: "Используйте только буквы, пробел, дефис и апостроф." },
  email: { type: "email", maxLength: 80, inputMode: "email", autocomplete: "email", title: "Введите корректный email." },
  regEmail: { type: "email", maxLength: 80, inputMode: "email", autocomplete: "email", title: "Введите корректный email." },
  loginEmail: { type: "email", maxLength: 80, inputMode: "email", autocomplete: "username", title: "Введите корректный email." },
  password: { type: "password", maxLength: 40, autocomplete: "current-password", title: "Пароль может содержать буквы, цифры и стандартные спецсимволы." },
  regPassword: { type: "password", maxLength: 40, autocomplete: "new-password", title: "Пароль может содержать буквы, цифры и стандартные спецсимволы." },
  loginPassword: { type: "password", maxLength: 40, autocomplete: "current-password", title: "Пароль может содержать буквы, цифры и стандартные спецсимволы." },
  newPassword: { type: "password", maxLength: 40, autocomplete: "new-password", title: "Пароль может содержать буквы, цифры и стандартные спецсимволы." },
  passportId: { type: "passport", maxLength: 20, title: "Только буквы и цифры без пробелов." },
  regPassport: { type: "passport", maxLength: 20, title: "Только буквы и цифры без пробелов." },
  profilePassport: { type: "passport", maxLength: 20, title: "Только буквы и цифры без пробелов." },
  birthDate: { type: "date" },
  regBirth: { type: "date" },
  profileBirth: { type: "date" },
  address: { type: "address", maxLength: 120, title: "Используйте буквы, цифры и стандартные знаки адреса." },
  regAddress: { type: "address", maxLength: 120, title: "Используйте буквы, цифры и стандартные знаки адреса." },
  profileAddress: { type: "address", maxLength: 120, title: "Используйте буквы, цифры и стандартные знаки адреса." },
  topic: { type: "topic", maxLength: 120, title: "Не используйте угловые скобки и слишком короткий текст." },
  supportTopic: { type: "topic", maxLength: 120, title: "Не используйте угловые скобки и слишком короткий текст." },
  title: { type: "title", maxLength: 120, title: "Не используйте угловые скобки и слишком короткий текст." },
  mailingTitle: { type: "title", maxLength: 120, title: "Не используйте угловые скобки и слишком короткий текст." },
  message: { type: "message", maxLength: 300, title: "Не используйте угловые скобки и слишком короткий текст." },
  supportMessage: { type: "message", maxLength: 300, title: "Не используйте угловые скобки и слишком короткий текст." },
  mailingMessage: { type: "message", maxLength: 300, title: "Не используйте угловые скобки и слишком короткий текст." },
  cardNumber: { type: "cardNumber", maxLength: 19, inputMode: "numeric", autocomplete: "cc-number", title: "Введите 16 цифр номера карты." },
  cardHolder: { type: "cardHolder", maxLength: 40, autocomplete: "cc-name", title: "Введите имя держателя латиницей." },
  expiry: { type: "expiry", maxLength: 5, inputMode: "numeric", autocomplete: "cc-exp", title: "Введите срок действия в формате MM/YY." },
  cvv: { type: "cvv", maxLength: 4, inputMode: "numeric", autocomplete: "cc-csc", title: "Введите 3 или 4 цифры CVV." },
  amount: { type: "amount", maxLength: 8, inputMode: "decimal", title: "Введите сумму в формате 10 или 10.50." },
  topupAmount: { type: "amount", maxLength: 8, inputMode: "decimal", title: "Введите сумму в формате 10 или 10.50." },
  promiseAmount: { type: "amount", maxLength: 8, inputMode: "decimal", title: "Введите сумму в формате 10 или 10.50." },
  balance: { type: "balance", maxLength: 9, inputMode: "decimal", title: "Введите корректное значение баланса." },
  clientSearch: { type: "search", maxLength: 120, title: "Поиск не принимает опасные символы." }
};

const RULE_ALIASES = Object.fromEntries(Object.entries(FIELD_RULES).map(([key, value]) => [key, value.type]));

const clientTabs = [
  { id: "overview", label: "Обзор" },
  { id: "numbers", label: "Номера" },
  { id: "payments", label: "Платежи" },
  { id: "tariffs", label: "Тарифы" },
  { id: "services", label: "Услуги" },
  { id: "promotions", label: "Акции" },
  { id: "support", label: "Поддержка" },
  { id: "profile", label: "Профиль" },
  { id: "notifications", label: "Уведомления" }
];

const adminTabs = [
  { id: "clients", label: "Клиенты" },
  { id: "support", label: "Поддержка" },
  { id: "mailing", label: "Рассылки" },
  { id: "history", label: "История действий" }
];

document.querySelectorAll(".tab-button").forEach((button) => {
  button.addEventListener("click", () => switchAuthTab(button.dataset.tab));
});
document.getElementById("themeToggle").addEventListener("click", handleThemeToggle);
document.getElementById("logoutButton").addEventListener("click", logout);
document.getElementById("refreshButton").addEventListener("click", fetchProfile);
document.getElementById("modalCloseButton").addEventListener("click", closeModal);
modalRoot.addEventListener("click", (event) => {
  if (event.target.dataset.closeModal === "true") closeModal();
});
document.addEventListener("input", handleValidatedInput);
document.addEventListener("blur", handleValidatedBlur, true);
document.addEventListener("keydown", handleValidatedKeydown, true);
document.addEventListener("paste", handleValidatedPaste, true);
loginForm.addEventListener("submit", handleLogin);
registerForm.addEventListener("submit", handleRegister);
applyValidationAttributes(document);

function switchAuthTab(tab) {
  document.querySelectorAll(".tab-button").forEach((button) => button.classList.toggle("active", button.dataset.tab === tab));
  loginForm.classList.toggle("hidden", tab !== "login");
  registerForm.classList.toggle("hidden", tab !== "register");
}

function showFlash(message, type = "info") {
  flashMessage.textContent = message;
  flashMessage.classList.remove("hidden", "error");
  if (type === "error") flashMessage.classList.add("error");
}

function hideFlash() {
  flashMessage.classList.add("hidden");
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function ensureObject(value) {
  return value && typeof value === "object" ? value : {};
}

function normalizeDashboardState() {
  state.meta = ensureObject(state.meta);
  state.user = ensureObject(state.user);

  state.meta.clients = ensureArray(state.meta.clients);
  state.meta.tickets = ensureArray(state.meta.tickets);
  state.meta.services = ensureArray(state.meta.services);
  state.meta.tariffs = ensureArray(state.meta.tariffs);
  state.meta.promotions = ensureArray(state.meta.promotions);
  state.meta.mailingHistory = ensureArray(state.meta.mailingHistory);

  state.user.notifications = ensureArray(state.user.notifications);
  state.user.connectedServices = ensureArray(state.user.connectedServices);
  state.user.numbers = ensureArray(state.user.numbers);
  state.user.operationHistory = ensureArray(state.user.operationHistory);
  state.user.compatibleServiceIds = ensureArray(state.user.compatibleServiceIds);

  state.user.balance = Number(state.user.balance || 0);
  state.user.bonusPoints = Number(state.user.bonusPoints || 0);
  state.user.fullName = String(state.user.fullName || "");
  state.user.simStatus = String(state.user.simStatus || "");
}

function showToast(title, text, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-title">
      <strong>${escapeHtml(title)}</strong>
      <button class="toast-close" type="button">×</button>
    </div>
    <div>${escapeHtml(text)}</div>
  `;
  toast.querySelector(".toast-close").addEventListener("click", () => toast.remove());
  toastStack.prepend(toast);
  window.setTimeout(() => toast.classList.add("is-hiding"), 4650);
  window.setTimeout(() => toast.remove(), 5050);
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("vmc_theme", theme);
}

function handleValidatedInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
  const rule = getFieldRule(target.name || target.id || "");
  if (!rule) return;
  const nextValue = sanitizeValue(target.value, rule);
  if (nextValue !== target.value) target.value = nextValue;
  updateFieldValidity(target);
}

function handleValidatedBlur(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
  updateFieldValidity(target);
}

function handleValidatedKeydown(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
  const rule = getFieldRule(target.name || target.id || "");
  if (!rule || event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) return;
  const nextValue = buildNextInputValue(target, event.key);
  if (sanitizeValue(nextValue, rule) !== nextValue) event.preventDefault();
}

function handleValidatedPaste(event) {
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

function getFieldRule(fieldName) {
  return RULE_ALIASES[fieldName] || null;
}

function sanitizeValue(value, rule) {
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

function validateFieldValue(fieldName, value, required = false) {
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
    cvv: () => /^\d{3}$/.test(text) ? null : "CVV должен содержать 3 цифры.",
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


function formatCardNumber(value) {
  return value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length < 3) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function normalizeDecimal(value, allowNegative, maxLength) {
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

function buildNextInputValue(target, insertedText) {
  const currentValue = target.value || "";
  const start = target.selectionStart ?? currentValue.length;
  const end = target.selectionEnd ?? start;
  return `${currentValue.slice(0, start)}${insertedText}${currentValue.slice(end)}`;
}

function applyValidationAttributes(root = document) {
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

function updateFieldValidity(field) {
  const key = field.name || field.id || "";
  field.setCustomValidity(validateFieldValue(key, field.value, field.required) || "");
}

function assertFields(fields) {
  for (const field of fields) {
    const error = validateFieldValue(field.name, field.value, field.required);
    if (error) throw new Error(error);
  }
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Ошибка запроса");
  return data;
}

async function handleLogin(event) {
  event.preventDefault();
  hideFlash();
  try {
    const email = loginForm.email.value.trim();
    const password = loginForm.password.value;
    assertFields([
      { name: "email", value: email, required: true },
      { name: "password", value: password, required: true }
    ]);
    const rememberPassword = document.getElementById("rememberPassword").checked;
    const data = await api("/api/login", {
      method: "POST",
      body: JSON.stringify({ email, password, rememberPassword })
    });
    state.token = data.token;
    state.user = data.user;
    state.meta = data.meta;
    state.activeTab = data.user.role === "admin" ? "clients" : "overview";
    localStorage.setItem("vmc_token", data.token);
    if (rememberPassword) {
      localStorage.setItem("vmc_email", email);
      localStorage.setItem("vmc_password", password);
    } else {
      localStorage.removeItem("vmc_email");
      localStorage.removeItem("vmc_password");
    }
    renderDashboard();
    showToast("Вход выполнен", "Вы успешно вошли в систему.");
  } catch (error) {
    showFlash(error.message, "error");
    showToast("Ошибка", error.message, "error");
  }
}

async function handleRegister(event) {
  event.preventDefault();
  hideFlash();
  try {
    const payload = Object.fromEntries(new FormData(registerForm).entries());
    assertFields([
      { name: "fullName", value: payload.fullName, required: true },
      { name: "email", value: payload.email, required: true },
      { name: "password", value: payload.password, required: true },
      { name: "passportId", value: payload.passportId, required: false },
      { name: "birthDate", value: payload.birthDate, required: false },
      { name: "address", value: payload.address, required: false }
    ]);
    const data = await api("/api/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    showFlash(`${data.message} Новый номер: ${data.generatedNumber}`);
    showToast("Регистрация завершена", `Создан номер ${data.generatedNumber}.`);
    registerForm.reset();
    switchAuthTab("login");
  } catch (error) {
    showFlash(error.message, "error");
    showToast("Ошибка", error.message, "error");
  }
}

async function logout() {
  modalEyebrow.textContent = "Подтверждение";
  modalTitle.textContent = "Выйти из системы";
  modalBody.innerHTML = `
    <p>Вы действительно хотите завершить текущий сеанс?</p>
    <div class="item-actions">
      <button id="confirmLogoutButton" class="primary-button danger-button" type="button">Выйти</button>
      <button id="cancelLogoutButton" class="ghost-button" type="button">Отмена</button>
    </div>
  `;
  modalRoot.classList.remove("hidden");
  document.getElementById("cancelLogoutButton").addEventListener("click", closeModal);
  document.getElementById("confirmLogoutButton").addEventListener("click", async () => {
    try {
      await api("/api/logout", { method: "POST" });
    } catch (error) {
      console.error(error);
    }
    state.token = "";
    state.user = null;
    localStorage.removeItem("vmc_token");
    authView.classList.remove("hidden");
    dashboardView.classList.add("hidden");
    closeModal();
    showToast("Выход выполнен", "Сеанс завершён.");
  });
}

async function fetchProfile() {
  if (!state.token) return;
  try {
    const data = await api("/api/me");
    if (!data || !data.user) throw new Error("Не удалось загрузить данные профиля.");
    state.user = data.user;
    state.meta = data.meta || {};
    renderDashboard();
  } catch (error) {
    showToast("Ошибка", error.message, "error");
  }
}

async function apiAction(path, payload, successTitle, successText) {
  try {
    const data = await api(path, { method: "POST", body: JSON.stringify(payload) });
    await fetchProfile();
    showToast(successTitle, successText);
    return data;
  } catch (error) {
    showToast("Ошибка", error.message, "error");
    return null;
  }
}

function handleThemeToggle() {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next);
  if (state.user && state.user.role === "client") {
    apiAction("/api/client/profile", {
      fullName: state.user.fullName,
      passportId: state.user.passportId,
      birthDate: state.user.birthDate,
      address: state.user.address,
      preferredTheme: next,
      rememberPassword: state.user.rememberPassword
    }, "Тема изменена", `Включена ${next === "dark" ? "тёмная" : "светлая"} тема.`);
  } else {
    showToast("Тема изменена", `Включена ${next === "dark" ? "тёмная" : "светлая"} тема.`);
  }
}

function renderDashboard() {
  if (!state.user) return;
  normalizeDashboardState();

  authView.classList.add("hidden");
  dashboardView.classList.remove("hidden");
  roleBadge.textContent = state.user.role === "admin" ? "Кабинет администратора" : "Личный кабинет клиента";
  welcomeTitle.textContent = state.user.fullName;
  const theme = state.user.role === "admin"
    ? (localStorage.getItem("vmc_theme") || state.user.preferredTheme || "light")
    : (state.user.preferredTheme || localStorage.getItem("vmc_theme") || "light");
  applyTheme(theme);

  const tabs = state.user.role === "admin" ? adminTabs : clientTabs;
  if (!tabs.some((tab) => tab.id === state.activeTab)) state.activeTab = tabs[0].id;

  sidebarTabs.innerHTML = tabs.map((tab) => `<button class="sidebar-tab ${state.activeTab === tab.id ? "active" : ""}" data-tab-id="${tab.id}" type="button">${tab.label}</button>`).join("");
  sidebarTabs.querySelectorAll("[data-tab-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeTab = button.dataset.tabId;
      renderDashboard();
    });
  });

  dashboardContent.innerHTML = state.user.role === "admin" ? renderAdminTab() : renderClientTab();
  applyValidationAttributes(dashboardContent);
  bindCommonEvents();
}

function renderStats(items) {
  return `
    <div class="stats-grid">
      ${items.map((item) => `
        <article class="stat-card">
          <p class="stat-label">${item.label}</p>
          <strong class="stat-value">${item.value}</strong>
          <span class="stat-note">${item.note}</span>
        </article>
      `).join("")}
    </div>
  `;
}

function renderClientTab() {
  const tickets = state.meta.tickets || [];
  switch (state.activeTab) {
    case "overview":
      return `
        <div class="dashboard-view">
          ${renderStats([
            { label: "Баланс", value: `${Number(state.user.balance || 0).toFixed(2)} BYN`, note: state.user.balance < 0 ? "Есть задолженность" : "Баланс положительный" },
            { label: "Бонусы", value: `${state.user.bonusPoints}`, note: "Начисляются за пополнения и акции" },
            { label: "Тариф", value: state.user.tariff ? state.user.tariff.name : "Не выбран", note: state.user.tariff ? state.user.tariff.category : "Без категории" },
            { label: "Номера", value: `${state.user.numbers.length}`, note: state.user.simStatus }
          ])}
          <div class="grid-two">
            <section class="panel-card">
              <div class="section-header"><div><h3>Быстрый обзор</h3><p class="helper-text">Основные сведения по аккаунту и ближайшим действиям.</p></div></div>
              <div class="item-list">
                ${renderCard("Текущий тариф", `${state.user.tariff ? state.user.tariff.name : "Не выбран"}<br>${state.user.tariff ? state.user.tariff.description : "Выберите подходящий тариф."}`)}
                ${renderCard("Подключённые услуги", state.user.connectedServices.length ? state.user.connectedServices.map((service) => service.name).join(", ") : "Платные услуги пока не подключены.")}
                ${renderCard("Техподдержка", tickets.length ? `Активных обращений: ${tickets.filter((ticket) => ticket.status !== "Закрыт").length}` : "Обращений пока нет.")}
              </div>
            </section>
            <section class="panel-card">
              <div class="section-header"><div><h3>Последние уведомления</h3><p class="helper-text">Вспомогательные сообщения и системные события.</p></div></div>
              <div class="item-list">${renderNotifications(state.user.notifications.slice(0, 4))}</div>
            </section>
          </div>
        </div>
      `;
    case "numbers":
      return `
        <div class="dashboard-view">
          <section class="panel-card">
            <div class="section-header">
              <div><h3>Управление номерами</h3><p class="helper-text">Добавление, просмотр и удаление дополнительных номеров.</p></div>
              <div class="section-actions"><button id="addNumberButton" class="primary-button" type="button">Подключить номер</button></div>
            </div>
            <div class="grid-three">
              ${(state.user.numbers || []).map((number) => `
                <div class="item-card">
                  <h4>${number}</h4>
                  <div class="item-meta">
                    <span class="badge">${state.user.simType}</span>
                    <span class="badge">${state.user.simStatus}</span>
                  </div>
                  <div class="item-actions">
                    <button class="ghost-button delete-number-button" data-number="${number}" type="button">Удалить номер</button>
                  </div>
                </div>
              `).join("")}
            </div>
          </section>
        </div>
      `;
    case "payments":
      return `
        <div class="dashboard-view">
          <div class="grid-two">
            <section class="panel-card">
              <div class="section-header"><div><h3>Пополнение банковской картой</h3><p class="helper-text">Введите данные карты для демонстрационного платежа.</p></div></div>
              <form id="cardTopupForm" class="form-grid">
                <div class="field"><label for="topupAmount">Сумма, BYN</label><input id="topupAmount" name="amount" type="number" min="3" step="0.1" required /></div>
                <div class="field"><label for="cardNumber">Номер карты</label><input id="cardNumber" name="cardNumber" type="text" placeholder="0000 0000 0000 0000" required /></div>
                <div class="field"><label for="cardHolder">Держатель карты</label><input id="cardHolder" name="cardHolder" type="text" placeholder="IVAN IVANOV" required /></div>
                <div class="grid-two">
                  <div class="field"><label for="cardExpiry">Срок действия</label><input id="cardExpiry" name="expiry" type="text" placeholder="12/28" required /></div>
                  <div class="field"><label for="cardCvv">CVV</label><input id="cardCvv" name="cvv" type="password" placeholder="123" required /></div>
                </div>
                <button class="primary-button" type="submit">Оплатить картой</button>
              </form>
            </section>
            <section class="panel-card">
              <div class="section-header"><div><h3>Обещанный платёж</h3><p class="helper-text">Доступен как временная финансовая поддержка.</p></div></div>
              <form id="promisedPaymentForm" class="form-grid">
                <div class="field"><label for="promiseAmount">Сумма, BYN</label><input id="promiseAmount" name="amount" type="number" min="1" max="25" step="0.1" required /></div>
                <button class="primary-button" type="submit">Активировать обещанный платёж</button>
              </form>
            </section>
          </div>
          <section class="panel-card">
            <div class="section-header"><div><h3>История операций</h3><p class="helper-text">Все платежи, списания и сервисные действия.</p></div></div>
            <div class="table-wrap">${renderOperationsTable(state.user.operationHistory)}</div>
          </section>
        </div>
      `;
    case "tariffs":
      return renderCatalogTab(state.meta.tariffs, "tariff");
    case "services":
      return renderCatalogTab(state.meta.services, "service");
    case "promotions":
      return `
        <div class="dashboard-view">
          <section class="panel-card">
            <div class="section-header"><div><h3>Акции</h3><p class="helper-text">Нажмите «Подробнее», чтобы открыть полное описание акции.</p></div></div>
            <div class="grid-three">${state.meta.promotions.map((item) => renderCatalogCard(item, "promotion")).join("")}</div>
          </section>
        </div>
      `;
    case "support":
      return `
        <div class="dashboard-view">
          <div class="grid-two">
            <section class="panel-card">
              <div class="section-header"><div><h3>Создать обращение</h3><p class="helper-text">Задайте вопрос технической поддержке.</p></div></div>
              <form id="supportForm" class="form-grid">
                <div class="field"><label for="supportTopic">Тема</label><input id="supportTopic" name="topic" type="text" required /></div>
                <div class="field"><label for="supportMessage">Сообщение</label><textarea id="supportMessage" name="message" required></textarea></div>
                <button class="primary-button" type="submit">Отправить обращение</button>
              </form>
            </section>
            <section class="panel-card">
              <div class="section-header"><div><h3>Мои обращения</h3><p class="helper-text">Статусы заявок обновляются автоматически.</p></div></div>
              <div class="item-list">${renderTickets(tickets, false)}</div>
            </section>
          </div>
        </div>
      `;
    case "profile":
      return `
        <div class="dashboard-view">
          <div class="grid-two">
            <section class="panel-card">
              <div class="section-header"><div><h3>Личные данные</h3><p class="helper-text">Профиль, пароль и параметры входа.</p></div></div>
              <form id="profileForm" class="form-grid">
                <div class="field"><label for="profileName">ФИО</label><input id="profileName" name="fullName" type="text" value="${escapeHtml(state.user.fullName || "")}" required /></div>
                <div class="field"><label for="profilePassport">Паспорт</label><input id="profilePassport" name="passportId" type="text" value="${escapeHtml(state.user.passportId || "")}" /></div>
                <div class="field"><label for="profileBirth">Дата рождения</label><input id="profileBirth" name="birthDate" type="date" value="${escapeHtml(state.user.birthDate || "")}" /></div>
                <div class="field"><label for="profileAddress">Адрес</label><input id="profileAddress" name="address" type="text" value="${escapeHtml(state.user.address || "")}" /></div>
                <div class="field"><label for="profilePassword">Новый пароль</label><input id="profilePassword" name="newPassword" type="password" placeholder="Оставьте пустым, если не меняете" /></div>
                <div class="field"><label for="profileTheme">Тема</label><select id="profileTheme" name="preferredTheme"><option value="light" ${state.user.preferredTheme === "light" ? "selected" : ""}>Светлая</option><option value="dark" ${state.user.preferredTheme === "dark" ? "selected" : ""}>Тёмная</option></select></div>
                <label class="checkbox"><input id="profileRemember" name="rememberPassword" type="checkbox" ${state.user.rememberPassword ? "checked" : ""} /><span>Сохранять пароль для быстрого входа</span></label>
                <button class="primary-button" type="submit">Сохранить изменения</button>
              </form>
            </section>
            <section class="panel-card">
              <div class="section-header"><div><h3>Статусы обращений</h3><p class="helper-text">Изменения, сделанные администратором, видны здесь.</p></div></div>
              <div class="item-list">${renderTickets(tickets, false)}</div>
            </section>
          </div>
        </div>
      `;
    case "notifications":
      return `
        <div class="dashboard-view">
          <section class="panel-card">
            <div class="section-header"><div><h3>Уведомления</h3><p class="helper-text">Все системные сообщения и результаты действий.</p></div></div>
            <div class="item-list">${renderNotifications(state.user.notifications)}</div>
          </section>
        </div>
      `;
    default:
      return "";
  }
}

function renderAdminTab() {
  const clients = Array.isArray(state.meta.clients) ? getFilteredAndSortedClients() : [];
  const tickets = Array.isArray(state.meta.tickets) ? state.meta.tickets : [];
  const mailings = Array.isArray(state.meta.mailingHistory) ? state.meta.mailingHistory : [];
  switch (state.activeTab) {
    case "clients":
      return `
        <div class="dashboard-view">
          ${renderStats([
            { label: "Клиенты", value: `${clients.length}`, note: "Всего зарегистрировано" },
            { label: "С задолженностью", value: `${clients.filter((client) => client.balance < 0).length}`, note: "Нуждаются в контроле" },
            { label: "Обращения", value: `${tickets.length}`, note: "Всего обращений" },
            { label: "Рассылки", value: `${mailings.length}`, note: "История уведомлений" }
          ])}
          <section class="panel-card">
            <div class="section-header"><div><h3>Клиенты</h3><p class="helper-text">Поиск по всем полям и сортировка по заголовкам таблицы.</p></div></div>
            <div class="toolbar">
              <div class="field"><label for="clientSearch">Поиск</label><input id="clientSearch" type="text" value="${escapeHtml(state.adminSearch)}" placeholder="Имя, email, номер, паспорт, адрес, тариф, статус SIM" /></div>
            </div>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    ${renderAdminSortHead("fullName", "Клиент")}
                    ${renderAdminSortHead("email", "Email")}
                    ${renderAdminSortHead("numbers", "Номера")}
                    ${renderAdminSortHead("balance", "Баланс")}
                    ${renderAdminSortHead("tariff", "Тариф")}
                    ${renderAdminSortHead("simStatus", "SIM-статус")}
                    ${renderAdminSortHead("ticketCount", "Обращения")}
                    <th>Действие</th>
                  </tr>
                </thead>
                <tbody id="clientsTableBody">${renderClientsRows(clients)}</tbody>
              </table>
            </div>
          </section>
        </div>
      `;
    case "support":
      return `
        <div class="dashboard-view">
          <section class="panel-card">
            <div class="section-header"><div><h3>Поддержка</h3><p class="helper-text">Обращения можно переводить в работу и закрывать.</p></div></div>
            <div class="item-list">${renderTickets(tickets, true)}</div>
          </section>
        </div>
      `;
    case "mailing":
      return `
        <div class="dashboard-view">
          <div class="grid-two">
            <section class="panel-card">
              <div class="section-header"><div><h3>Создать рассылку</h3><p class="helper-text">Выберите нужную группу получателей.</p></div></div>
              <form id="mailingForm" class="form-grid">
                <div class="field"><label for="mailingTitle">Тема</label><input id="mailingTitle" name="title" type="text" required /></div>
                <div class="field"><label for="mailingMessage">Текст</label><textarea id="mailingMessage" name="message" required></textarea></div>
                <div class="field">
                  <label for="mailingFilterMode">Группа получателей</label>
                  <select id="mailingFilterMode" name="mode">
                    <option value="all">Все клиенты</option>
                    <option value="negative-balance">С отрицательным балансом</option>
                    <option value="multi-number">С несколькими номерами</option>
                    <option value="tariff">По тарифу</option>
                  </select>
                </div>
                <div class="field hidden" id="mailingTariffField">
                  <label for="mailingTariffId">Тариф</label>
                  <select id="mailingTariffId" name="tariffId">${state.meta.tariffs.map((tariff) => `<option value="${tariff.id}">${tariff.name}</option>`).join("")}</select>
                </div>
                <button class="primary-button" type="submit">Отправить рассылку</button>
              </form>
            </section>
            <section class="panel-card">
              <div class="section-header"><div><h3>История рассылок</h3><p class="helper-text">Список отправленных уведомлений.</p></div></div>
              <div class="item-list">
                ${mailings.map((item) => renderCard(item.title, `${item.message}<br>${formatDate(item.sentAt)} | Получателей: ${item.recipientsCount}`)).join("") || '<div class="empty-state">Рассылок пока нет.</div>'}
              </div>
            </section>
          </div>
        </div>
      `;
    case "history":
      return `
        <div class="dashboard-view">
          <section class="panel-card">
            <div class="section-header"><div><h3>История действий</h3><p class="helper-text">Последние кампании рассылок.</p></div></div>
            <div class="item-list">
              ${mailings.map((item) => renderCard(item.title, `${item.message}<br>${formatDate(item.sentAt)}`)).join("") || '<div class="empty-state">История пока пуста.</div>'}
            </div>
          </section>
        </div>
      `;
    default:
      return "";
  }
}

function renderCatalogTab(items, kind) {
  const grouped = items.reduce((acc, item) => {
    const key = item.category || "Популярное";
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});

  return `
    <div class="dashboard-view">
      ${Object.entries(grouped).map(([group, list]) => `
        <section class="panel-card">
          <div class="section-header"><div><h3>${group === "Без категории" ? "Популярное" : group}</h3></div></div>
          <div class="grid-three">${list.map((item) => renderCatalogCard(item, kind)).join("")}</div>
        </section>
      `).join("")}
    </div>
  `;
}

function renderCatalogCard(item, kind) {
  let extra = "";
  if (kind === "tariff") extra = `${item.monthlyPrice} BYN/мес | ${item.minutes} мин | ${item.internetGb} ГБ | ${item.sms} SMS`;
  if (kind === "service") extra = `${item.type} | ${item.price} BYN`;
  const isCurrentTariff = kind === "tariff" && state.user && state.user.tariff && state.user.tariff.id === item.id;
  const connectedServices = ensureArray(state.user?.connectedServices);
  return `
    <div class="item-card">
      <h4>${item.name || item.title}</h4>
      <p>${item.description}</p>
      ${extra ? `<div class="item-meta"><span class="badge">${extra}</span></div>` : ""}
      <div class="item-actions">
        <button class="ghost-button detail-button" data-kind="${kind}" data-id="${item.id}" type="button">Подробнее</button>
        ${kind === "tariff" ? `<button class="primary-button tariff-select-button" data-id="${item.id}" type="button" ${isCurrentTariff ? "disabled" : ""}>${isCurrentTariff ? "Текущий" : "Выбрать"}</button>` : ""}
        ${kind === "service" ? `<button class="primary-button service-toggle-button" data-id="${item.id}" type="button">${connectedServices.some((service) => service.id === item.id) ? "Отключить" : "Подключить"}</button>` : ""}
      </div>
    </div>
  `;
}

function renderCard(title, body) {
  return `<div class="item-card"><h4>${title}</h4><p>${body}</p></div>`;
}

function renderNotifications(items) {
  items = ensureArray(items);
  return items.length
    ? items.map((item) => renderCard(item.title, `${item.text}<br>${formatDate(item.createdAt)}`)).join("")
    : '<div class="empty-state">Уведомлений пока нет.</div>';
}

function renderTickets(items, adminMode) {
  if (!Array.isArray(items) || !items.length) return '<div class="empty-state">Обращений пока нет.</div>';
  return items.map((ticket) => `
    <div class="item-card">
      <h4>${ticket.topic}</h4>
      <p>${ticket.message}</p>
      <div class="item-meta">
        ${adminMode ? `<span class="badge">Клиент ID: ${ticket.clientId}</span>` : ""}
        <span class="badge">${formatDate(ticket.createdAt)}</span>
        <span class="badge ${ticketStatusClass(ticket.status)}">${ticket.status}</span>
      </div>
      ${adminMode ? `
        <div class="item-actions">
          <button class="ghost-button ticket-status-button" data-ticket-id="${ticket.id}" data-status="В работе" type="button">В работу</button>
          <button class="ghost-button ticket-status-button" data-ticket-id="${ticket.id}" data-status="Закрыт" type="button">Закрыть</button>
        </div>
      ` : ""}
    </div>
  `).join("");
}

function renderOperationsTable(items) {
  items = ensureArray(items);
  return `
    <table>
      <thead>
        <tr>
          <th>Дата</th>
          <th>Операция</th>
          <th>Описание</th>
          <th>Сумма</th>
          <th>Статус</th>
        </tr>
      </thead>
      <tbody>
        ${items.length ? items.map((item) => `
          <tr>
            <td>${formatDate(item.date)}</td>
            <td>${item.type}</td>
            <td>${item.description}</td>
            <td>${Number(item.amount).toFixed(2)} BYN</td>
            <td>${item.status}</td>
          </tr>
        `).join("") : '<tr><td colspan="5">История операций пока пуста.</td></tr>'}
      </tbody>
    </table>
  `;
}

function renderAdminSortHead(key, label) {
  const isActive = state.adminSort.key === key;
  const arrow = isActive ? (state.adminSort.direction === "asc" ? "↑" : "↓") : "";
  return `<th><button class="table-sort admin-sort-button" data-sort-key="${key}" type="button">${label} ${arrow}</button></th>`;
}

function renderClientsRows(clients) {
  return Array.isArray(clients) && clients.length
    ? clients.map((client) => `
      <tr>
        <td>${client.fullName}</td>
        <td>${client.email}</td>
        <td>${ensureArray(client.numbers).join(", ")}</td>
        <td class="${Number(client.balance || 0) < 0 ? "status-danger" : "status-success"}">${Number(client.balance || 0).toFixed(2)} BYN</td>
        <td>${client.tariff ? client.tariff.name : "Не выбран"}</td>
        <td>${client.simStatus}</td>
        <td>${client.ticketCount || 0}</td>
        <td><button class="ghost-button edit-client-button" data-client-id="${client.id}" type="button">Изменить</button></td>
      </tr>
    `).join("")
    : '<tr><td colspan="8">Поиск не дал результатов.</td></tr>';
}

function getFilteredAndSortedClients() {
  let clients = [...(state.meta.clients || [])];
  const search = state.adminSearch.trim().toLowerCase();
  if (search) {
    clients = clients.filter((client) => {
      const haystack = [
        client.fullName,
        client.email,
        client.passportId,
        client.address,
        client.simStatus,
        client.tariff ? client.tariff.name : "",
        client.tariff ? client.tariff.category : "",
        ...(client.numbers || []),
        ...(client.connectedServices || []).map((service) => service.name)
      ].join(" ").toLowerCase();
      return haystack.includes(search);
    });
  }

  const factor = state.adminSort.direction === "asc" ? 1 : -1;
  clients.sort((a, b) => {
    const valueA = getSortValue(a, state.adminSort.key);
    const valueB = getSortValue(b, state.adminSort.key);
    if (valueA > valueB) return factor;
    if (valueA < valueB) return -factor;
    return 0;
  });
  return clients;
}

function getSortValue(client, key) {
  if (key === "balance") return Number(client.balance || 0);
  if (key === "numbers") return (client.numbers || []).join(" ");
  if (key === "tariff") return client.tariff ? client.tariff.name : "";
  return client[key] || "";
}

function bindCommonEvents() {
  bindClientEvents();
  bindAdminEvents();
  document.querySelectorAll(".detail-button").forEach((button) => {
    button.addEventListener("click", () => openDetailsModal(button.dataset.kind, button.dataset.id));
  });
}

async function requestTariffChange(tariffId) {
  const nextTariff = (state.meta.tariffs || []).find((item) => item.id === tariffId);
  const currentTariff = state.user?.tariff;
  if (!nextTariff) return;
  if (currentTariff && currentTariff.id === nextTariff.id) {
    showToast("Тариф уже активен", "Выберите другой вариант.");
    return;
  }

  let payload = { tariffId };
  if (currentTariff && Number(nextTariff.monthlyPrice || 0) < Number(currentTariff.monthlyPrice || 0)) {
    const confirmed = window.confirm("При смене на более доступный тариф будет разово списано 5 BYN. Продолжить?");
    if (!confirmed) return;
    payload.confirmDowngrade = true;
  } else {
    const confirmed = window.confirm(`Подтвердите смену тарифа на ${nextTariff.name}.`);
    if (!confirmed) return;
  }

  await apiAction("/api/client/tariff", payload, "Тариф изменён", "Новый тариф подключён.");
}

function openNumberModal() {
  modalEyebrow.textContent = "Новый номер";
  modalTitle.textContent = "Выбор номера";
  modalBody.innerHTML = `
    <div class="item-list">
      <div class="item-card">
        <h4>Случайный номер</h4>
        <p>Система подберёт свободный номер. Красивый номер может выпасть случайно.</p>
        <button id="randomNumberPick" class="primary-button" type="button">Получить случайный</button>
      </div>
      <form id="numberSearchForm" class="form-grid">
        <div class="field">
          <label for="desiredNumber">Конкретный номер</label>
          <input id="desiredNumber" name="desiredNumber" type="text" placeholder="+375291234567" />
        </div>
        <button class="ghost-button" type="submit">Проверить свободный номер</button>
        <div id="numberSearchResults" class="item-list"></div>
      </form>
    </div>
  `;
  modalRoot.classList.remove("hidden");
  applyValidationAttributes(modalBody);

  document.getElementById("randomNumberPick")?.addEventListener("click", async () => {
    const result = await apiAction("/api/client/numbers/add", { mode: "random" }, "Номер подключён", "Дополнительный номер успешно добавлен.");
    if (result?.generatedNumber) {
      showToast("Новый номер", `${result.generatedNumber} | доплата ${Number(result.surcharge || 0).toFixed(2)} BYN`);
      closeModal();
    }
  });

  document.getElementById("numberSearchForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = document.getElementById("desiredNumber");
    const query = input.value.trim();
    const results = document.getElementById("numberSearchResults");
    const response = await api(`/api/client/numbers/search?query=${encodeURIComponent(query)}`);
    if (!response.options?.length) {
      results.innerHTML = '<div class="empty-state">Номер не найден или он уже занят.</div>';
      return;
    }
    results.innerHTML = response.options.map((item) => `
      <div class="item-card">
        <h4>${item.number}</h4>
        <p>Доплата: ${Number(item.surcharge || 0).toFixed(2)} BYN</p>
        <button class="primary-button pick-specific-number" data-number="${item.number}" type="button">Выбрать</button>
      </div>
    `).join("");
    results.querySelectorAll(".pick-specific-number").forEach((button) => {
      button.addEventListener("click", async () => {
        const result = await apiAction("/api/client/numbers/add", { mode: "specific", number: button.dataset.number }, "Номер подключён", "Выбранный номер успешно добавлен.");
        if (result?.generatedNumber) closeModal();
      });
    });
  });
}

function bindClientEvents() {
  document.querySelectorAll(".tariff-select-button").forEach((button) => {
    button.addEventListener("click", async () => {
      await requestTariffChange(button.dataset.id);
    });
  });

  document.querySelectorAll(".service-toggle-button").forEach((button) => {
    button.addEventListener("click", async () => {
      await apiAction("/api/client/services/toggle", { serviceId: button.dataset.id }, "Услуга обновлена", "Список подключённых услуг изменён.");
    });
  });

  document.getElementById("addNumberButton")?.addEventListener("click", openNumberModal);

  document.querySelectorAll(".delete-number-button").forEach((button) => {
    button.addEventListener("click", async () => {
      const number = button.dataset.number;
      if (!window.confirm(`Удалить номер ${number}?`)) return;
      await apiAction("/api/client/numbers/delete", { number }, "Номер удалён", `Номер ${number} удалён из аккаунта.`);
    });
  });

  document.getElementById("cardTopupForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
      assertFields([
        { name: "amount", value: payload.amount, required: true },
        { name: "cardNumber", value: payload.cardNumber, required: true },
        { name: "cardHolder", value: payload.cardHolder, required: true },
        { name: "expiry", value: payload.expiry, required: true },
        { name: "cvv", value: payload.cvv, required: true }
      ]);
      payload.method = "card";
      payload.amount = Number(payload.amount);
      if (payload.amount < 3) throw new Error("Минимальная сумма оплаты картой составляет 3 BYN.");
      const result = await apiAction("/api/client/topup", payload, "Платёж выполнен", "Баланс успешно пополнен с карты.");
      if (result) event.currentTarget.reset();
    } catch (error) {
      showToast("Ошибка", error.message, "error");
    }
  });

  document.getElementById("promisedPaymentForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
      assertFields([{ name: "amount", value: payload.amount, required: true }]);
      payload.method = "promised-payment";
      payload.amount = Number(payload.amount);
      const result = await apiAction("/api/client/topup", payload, "Обещанный платёж активирован", "Средства временно зачислены на баланс.");
      if (result) event.currentTarget.reset();
    } catch (error) {
      showToast("Ошибка", error.message, "error");
    }
  });

  document.getElementById("supportForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
      assertFields([
        { name: "topic", value: payload.topic, required: true },
        { name: "message", value: payload.message, required: true }
      ]);
      const result = await apiAction("/api/client/support", payload, "Обращение отправлено", "Заявка создана и передана в поддержку.");
      if (result) event.currentTarget.reset();
    } catch (error) {
      showToast("Ошибка", error.message, "error");
    }
  });

  document.getElementById("profileForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
      assertFields([
        { name: "fullName", value: payload.fullName, required: true },
        { name: "passportId", value: payload.passportId, required: false },
        { name: "birthDate", value: payload.birthDate, required: false },
        { name: "address", value: payload.address, required: false },
        { name: "newPassword", value: payload.newPassword, required: false }
      ]);
      payload.rememberPassword = document.getElementById("profileRemember").checked;
      const result = await apiAction("/api/client/profile", payload, "Профиль обновлён", "Личные данные успешно сохранены.");
      if (result) {
        if (payload.rememberPassword) {
          localStorage.setItem("vmc_email", state.user.email);
          if (payload.newPassword) localStorage.setItem("vmc_password", payload.newPassword);
        } else {
          localStorage.removeItem("vmc_password");
        }
      }
    } catch (error) {
      showToast("Ошибка", error.message, "error");
    }
  });
}

function bindAdminEvents() {
  document.getElementById("clientSearch")?.addEventListener("input", (event) => {
    state.adminSearch = event.target.value;
    refreshClientsTable();
  });

  document.querySelectorAll(".admin-sort-button").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.sortKey;
      if (state.adminSort.key === key) {
        state.adminSort.direction = state.adminSort.direction === "asc" ? "desc" : "asc";
      } else {
        state.adminSort.key = key;
        state.adminSort.direction = "asc";
      }
      renderDashboard();
    });
  });

  document.querySelectorAll(".edit-client-button").forEach((button) => {
    button.addEventListener("click", () => openClientEditModal(Number(button.dataset.clientId)));
  });

  document.querySelectorAll(".ticket-status-button").forEach((button) => {
    button.addEventListener("click", async () => {
      const status = button.dataset.status;
      await apiAction("/api/admin/ticket/status", { ticketId: Number(button.dataset.ticketId), status }, "Статус обращения обновлён", `Обращение переведено в статус "${status}".`);
    });
  });

  document.getElementById("mailingFilterMode")?.addEventListener("change", (event) => {
    document.getElementById("mailingTariffField").classList.toggle("hidden", event.target.value !== "tariff");
  });

  document.getElementById("mailingForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const form = event.currentTarget;
      assertFields([
        { name: "title", value: form.title.value, required: true },
        { name: "message", value: form.message.value, required: true }
      ]);
      const mode = form.mode.value;
      const payload = {
        title: form.title.value,
        message: form.message.value,
        filter: mode === "tariff" ? { mode, tariffId: form.tariffId.value } : { mode }
      };
      const result = await apiAction("/api/admin/mailing", payload, "Рассылка отправлена", "Уведомления отправлены выбранной группе клиентов.");
      if (result) form.reset();
      document.getElementById("mailingTariffField")?.classList.add("hidden");
    } catch (error) {
      showToast("Ошибка", error.message, "error");
    }
  });
}

function refreshClientsTable() {
  const tbody = document.getElementById("clientsTableBody");
  if (!tbody) return;
  tbody.innerHTML = renderClientsRows(getFilteredAndSortedClients());
  document.querySelectorAll(".edit-client-button").forEach((button) => {
    button.addEventListener("click", () => openClientEditModal(Number(button.dataset.clientId)));
  });
}

function openDetailsModal(kind, id) {
  const map = { tariff: state.meta.tariffs, service: state.meta.services, promotion: state.meta.promotions };
  const item = (map[kind] || []).find((entry) => entry.id === id);
  if (!item) return;

  modalEyebrow.textContent = kind === "promotion" ? "Акция" : item.category || "";
  modalTitle.textContent = item.name || item.title;

  let body = `<p>${item.details || item.description}</p>`;
  if (kind === "tariff") {
    const compatibleServices = ensureArray(state.meta.services).filter((service) => ensureArray(state.user.compatibleServiceIds).includes(service.id));
    body += `
      <div class="item-meta">
        <span class="badge">${item.monthlyPrice} BYN/мес</span>
        <span class="badge">${item.minutes} минут</span>
        <span class="badge">${item.internetGb} ГБ</span>
        <span class="badge">${item.sms} SMS</span>
      </div>
      <p><strong>Входящие услуги:</strong> ${(item.servicesIncluded || []).map((serviceId) => {
        const service = state.meta.services.find((entry) => entry.id === serviceId);
        return service ? service.name : serviceId;
      }).join(", ")}</p>
      <p><strong>Подходящие для этого тарифа:</strong> ${compatibleServices.length ? compatibleServices.slice(0, 4).map((service) => service.name).join(", ") : "Дополнительные опции не требуются."}</p>
      <div class="item-actions"><button class="primary-button modal-tariff-select" data-id="${item.id}" type="button">Подключить тариф</button></div>
    `;
  }
  if (kind === "service") {
    const connected = ensureArray(state.user.connectedServices).some((service) => service.id === item.id);
    body += `
      <div class="item-meta">
        <span class="badge">${item.type}</span>
        <span class="badge">${item.price} BYN</span>
      </div>
      <div class="item-actions"><button class="primary-button modal-service-toggle" data-id="${item.id}" type="button">${connected ? "Отключить" : "Подключить"}</button></div>
    `;
  }
  modalBody.innerHTML = body;
  modalRoot.classList.remove("hidden");

  modalBody.querySelector(".modal-tariff-select")?.addEventListener("click", async () => {
    await requestTariffChange(id);
    closeModal();
  });
  modalBody.querySelector(".modal-service-toggle")?.addEventListener("click", async () => {
    const result = await apiAction("/api/client/services/toggle", { serviceId: id }, "Услуга обновлена", "Состояние услуги изменено.");
    if (result) closeModal();
  });
}

function openClientEditModal(clientId) {
  const client = (state.meta.clients || []).find((item) => item.id === clientId);
  if (!client) return;
  const clientConnectedServices = ensureArray(client.connectedServices);
  modalEyebrow.textContent = "Редактирование клиента";
  modalTitle.textContent = client.fullName;
  modalBody.innerHTML = `
    <form id="clientEditForm" class="form-grid">
      <input name="clientId" type="hidden" value="${client.id}" />
      <div class="field"><label for="editName">ФИО</label><input id="editName" name="fullName" type="text" value="${escapeHtml(client.fullName || "")}" /></div>
      <div class="field"><label for="editAddress">Адрес</label><input id="editAddress" name="address" type="text" value="${escapeHtml(client.address || "")}" /></div>
      <div class="field"><label for="editPassport">Паспорт</label><input id="editPassport" name="passportId" type="text" value="${escapeHtml(client.passportId || "")}" /></div>
      <div class="field"><label for="editBalance">Баланс</label><input id="editBalance" name="balance" type="number" step="0.1" value="${client.balance}" /></div>
      <div class="field"><label for="editTariff">Тариф</label><select id="editTariff" name="tariffId">${state.meta.tariffs.map((tariff) => `<option value="${tariff.id}" ${client.tariff && client.tariff.id === tariff.id ? "selected" : ""}>${tariff.name}</option>`).join("")}</select></div>
      <div class="field"><label for="editServices">Услуги</label><select id="editServices" name="connectedServiceIds" multiple>${state.meta.services.map((service) => `<option value="${service.id}" ${clientConnectedServices.some((item) => item.id === service.id) ? "selected" : ""}>${service.name}</option>`).join("")}</select></div>
      <div class="field"><label for="editSimStatus">SIM-статус</label><select id="editSimStatus" name="simStatus"><option value="Ожидает выдачи физической SIM" ${client.simStatus === "Ожидает выдачи физической SIM" ? "selected" : ""}>Ожидает выдачи</option><option value="Физическая SIM выдана в отделении" ${client.simStatus === "Физическая SIM выдана в отделении" ? "selected" : ""}>SIM выдана</option><option value="SIM заблокирована" ${client.simStatus === "SIM заблокирована" ? "selected" : ""}>SIM заблокирована</option></select></div>
      <button class="primary-button" type="submit">Сохранить изменения</button>
    </form>
    `;
    modalRoot.classList.remove("hidden");
    applyValidationAttributes(modalBody);
  
    document.getElementById("clientEditForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const form = event.currentTarget;
      assertFields([
        { name: "fullName", value: form.fullName.value, required: true },
        { name: "address", value: form.address.value, required: false },
        { name: "passportId", value: form.passportId.value, required: false },
        { name: "balance", value: form.balance.value, required: true }
      ]);
      const payload = {
        clientId: Number(form.clientId.value),
        fullName: form.fullName.value,
        address: form.address.value,
        passportId: form.passportId.value,
        balance: Number(form.balance.value),
        tariffId: form.tariffId.value,
        connectedServiceIds: Array.from(form.connectedServiceIds.selectedOptions).map((option) => option.value),
        simStatus: form.simStatus.value
      };
      const result = await apiAction("/api/admin/client/update", payload, "Клиент обновлён", "Изменения клиента успешно сохранены.");
      if (result) closeModal();
    } catch (error) {
      showToast("Ошибка", error.message, "error");
    }
  });
}

function closeModal() {
  modalRoot.classList.add("hidden");
  modalEyebrow.textContent = "";
  modalTitle.textContent = "";
  modalBody.innerHTML = "";
}

function ticketStatusClass(status) {
  if (status === "Закрыт") return "status-closed";
  if (status === "В работе") return "status-working";
  return "status-open";
}

function formatDate(value) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

loginForm.email.value = state.rememberedEmail;
loginForm.password.value = state.rememberedPassword;
document.getElementById("rememberPassword").checked = Boolean(state.rememberedPassword);
applyTheme(localStorage.getItem("vmc_theme") || "light");
if (state.token) fetchProfile();
