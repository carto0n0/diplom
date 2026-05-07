export const state = {
  token: localStorage.getItem("vmc_token") || "",
  rememberedEmail: localStorage.getItem("vmc_email") || "",
  rememberedPassword: localStorage.getItem("vmc_password") || "",
  user: null,
  meta: { tariffs: [], services: [], promotions: [], tickets: [], mailingHistory: [], clients: [] },
  activeTab: "overview",
  adminSort: { key: "balance", direction: "asc" },
  adminSearch: ""
};

export const API_BASE_STORAGE_KEY = "vmc_api_base";
const apiBaseFromQuery = new URLSearchParams(window.location.search).get("apiBase");
const apiBaseFromStorage = localStorage.getItem(API_BASE_STORAGE_KEY) || "";
const defaultApiBase = window.location.hostname.endsWith("github.io") ? "http://localhost:5000" : "";

export function normalizeApiBase(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  return trimmed.replace(/\/+$/, "");
}

export const API_BASE_URL = normalizeApiBase(apiBaseFromQuery || apiBaseFromStorage || defaultApiBase);

if (apiBaseFromQuery !== null) {
  if (API_BASE_URL) localStorage.setItem(API_BASE_STORAGE_KEY, API_BASE_URL);
  else localStorage.removeItem(API_BASE_STORAGE_KEY);
}
