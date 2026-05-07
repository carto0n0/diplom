import { loginForm, registerForm, flashMessage } from "../../core/dom.js";

export function switchAuthTab(tab) {
  document.querySelectorAll(".tab-button").forEach((button) => button.classList.toggle("active", button.dataset.tab === tab));
  loginForm.classList.toggle("hidden", tab !== "login");
  registerForm.classList.toggle("hidden", tab !== "register");
}

export function showFlash(message, type = "info") {
  flashMessage.textContent = message;
  flashMessage.classList.remove("hidden", "error");
  if (type === "error") flashMessage.classList.add("error");
}

export function hideFlash() {
  flashMessage.classList.add("hidden");
}
