export function createAuthHandlers({
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
}) {
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

  return {
    handleLogin,
    handleRegister,
    logout,
    fetchProfile,
    apiAction
  };
}
