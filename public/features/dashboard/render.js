export function createDashboardRenderer({
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
  bindCommonEvents
}) {
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

  function ticketStatusClass(status) {
    if (status === "Закрыт") return "status-closed";
    if (status === "В работе") return "status-working";
    return "status-open";
  }

  return {
    renderDashboard,
    renderClientsRows,
    getFilteredAndSortedClients
  };
}
