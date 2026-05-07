import { modalRoot, modalEyebrow, modalTitle, modalBody } from "../../core/dom.js";

export function closeModal() {
  modalRoot.classList.add("hidden");
  modalEyebrow.textContent = "";
  modalTitle.textContent = "";
  modalBody.innerHTML = "";
}
