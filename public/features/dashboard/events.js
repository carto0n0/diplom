export function createDashboardEvents({
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
  renderClientsRows,
  getFilteredAndSortedClients
}) {
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
        const result = await apiAction("/api/client/topup", payload, "Платёж выполнен", "Баланс успешно пополнен с карты.", { silentErrors: true });
        if (result) event.currentTarget.reset();
      } catch (error) {
        console.warn(error);
      }
    });

    document.getElementById("promisedPaymentForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
        assertFields([{ name: "amount", value: payload.amount, required: true }]);
        payload.method = "promised-payment";
        payload.amount = Number(payload.amount);
        if (payload.amount > 25) {
          showToast("Предупреждение", "Обещанный платёж максимум 25 рублей.", "warning");
          return;
        }
        const result = await apiAction("/api/client/topup", payload, "Обещанный платёж активирован", "Средства временно зачислены на баланс.", { silentErrors: true });
        if (result) event.currentTarget.reset();
      } catch (error) {
        console.warn(error);
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
        const result = await apiAction("/api/client/support", payload, "Обращение отправлено", "Заявка создана и передана в поддержку.", { silentErrors: true });
        if (result) event.currentTarget.reset();
      } catch (error) {
        console.warn(error);
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

  return {
    bindCommonEvents
  };
}
