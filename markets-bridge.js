(() => {
  const frame = document.getElementById("markets-reference");
  function syncLanguage() {
    const language = window.HKJobI18n?.getLanguage() === "zh" ? "zh-Hans" : "en";
    const select = frame.contentDocument?.getElementById("language");
    if (select && select.value !== language) {
      select.value = language;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
  frame.addEventListener("load", syncLanguage);
  document.addEventListener("click", event => {
    if (event.target.closest("[data-lang]")) setTimeout(syncLanguage, 0);
  });
  window.addEventListener("resize", syncLanguage);
  syncLanguage();
})();
