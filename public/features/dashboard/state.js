import { state } from "../../core/state.js";
import { ensureArray, ensureObject } from "../../shared/utils/guards.js";

export function normalizeDashboardState() {
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
