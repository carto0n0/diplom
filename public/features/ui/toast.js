import { escapeHtml } from "../../shared/utils/format.js";

export function createShowToast(toastStack) {
  return function showToast(title, text, type = "success") {
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
  };
}
