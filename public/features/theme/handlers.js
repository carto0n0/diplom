export function createThemeToggleHandler({ state, applyTheme, apiAction, showToast }) {
  return function handleThemeToggle() {
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
  };
}
