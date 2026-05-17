import { state } from "./core/state.js";
import { api } from "./core/api.js";
import {
  authView,
  dashboardView,
  dashboardContent,
  sidebarTabs,
  loginForm,
  registerForm,
  roleBadge,
  welcomeTitle,
  modalRoot,
  modalEyebrow,
  modalTitle,
  modalBody,
  toastStack
} from "./core/dom.js";
import { ensureArray } from "./shared/utils/guards.js";
import { formatDate, escapeHtml } from "./shared/utils/format.js";
import { switchAuthTab, showFlash, hideFlash } from "./features/auth/view.js";
import { createAuthHandlers } from "./features/auth/handlers.js";
import { applyTheme } from "./features/theme/theme.js";
import { createThemeToggleHandler } from "./features/theme/handlers.js";
import { closeModal } from "./features/modal/modal.js";
import { normalizeDashboardState } from "./features/dashboard/state.js";
import { createDashboardRenderer } from "./features/dashboard/render.js";
import { createDashboardEvents } from "./features/dashboard/events.js";
import { createShowToast } from "./features/ui/toast.js";
import {
  handleValidatedInput,
  handleValidatedBlur,
  handleValidatedKeydown,
  handleValidatedPaste,
  applyValidationAttributes,
  assertFields
} from "./shared/validation/validate.js";

const showToast = createShowToast(toastStack);
const authHandlers = createAuthHandlers({
  state,
  api,
  loginForm,
  registerForm,
  authView,
  dashboardView,
  modalEyebrow,
  modalTitle,
  modalBody,
  modalRoot,
  assertFields,
  hideFlash,
  showFlash,
  showToast,
  switchAuthTab,
  closeModal,
  renderDashboard
});
const handleThemeToggle = createThemeToggleHandler({
  state,
  applyTheme,
  apiAction,
  showToast
});
let dashboardEvents = null;
const dashboardRenderer = createDashboardRenderer({
  state,
  authView,
  dashboardView,
  dashboardContent,
  sidebarTabs,
  roleBadge,
  welcomeTitle,
  normalizeDashboardState,
  applyTheme,
  applyValidationAttributes,
  ensureArray,
  formatDate,
  escapeHtml,
  bindCommonEvents: () => dashboardEvents?.bindCommonEvents()
});
dashboardEvents = createDashboardEvents({
  state,
  api,
  apiAction,
  assertFields,
  applyValidationAttributes,
  ensureArray,
  escapeHtml,
  showToast,
  closeModal,
  modalRoot,
  modalEyebrow,
  modalTitle,
  modalBody,
  renderDashboard,
  renderClientsRows: dashboardRenderer.renderClientsRows,
  getFilteredAndSortedClients: dashboardRenderer.getFilteredAndSortedClients
});

document.querySelectorAll(".tab-button").forEach((button) => {
  button.addEventListener("click", () => switchAuthTab(button.dataset.tab));
});
document.getElementById("themeToggle").addEventListener("click", handleThemeToggle);
document.getElementById("toggleLoginPassword")?.addEventListener("click", (event) => {
  const passwordInput = document.getElementById("loginPassword");
  if (!passwordInput) return;
  const nextType = passwordInput.type === "password" ? "text" : "password";
  passwordInput.type = nextType;
  event.currentTarget.textContent = nextType === "password" ? "Показать" : "Скрыть";
});
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
async function handleLogin(event) { return authHandlers.handleLogin(event); }
async function handleRegister(event) { return authHandlers.handleRegister(event); }
async function logout() { return authHandlers.logout(); }
async function fetchProfile() { return authHandlers.fetchProfile(); }
async function apiAction(path, payload, successTitle, successText, options) {
  return authHandlers.apiAction(path, payload, successTitle, successText, options);
}

function renderDashboard() {
  return dashboardRenderer.renderDashboard();
}

loginForm.email.value = state.rememberedEmail;
loginForm.password.value = state.rememberedPassword;
document.getElementById("rememberPassword").checked = Boolean(state.rememberedPassword);
applyTheme(localStorage.getItem("vmc_theme") || "light");
if (state.token) fetchProfile();
