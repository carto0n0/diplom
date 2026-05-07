export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("vmc_theme", theme);
}
