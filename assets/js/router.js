// Router simple para manejar navegación básica
document.addEventListener("click", function (e) {
  const link = e.target.closest("a");
  if (!link) return;

  const url = link.getAttribute("href");
  if (!url || url.startsWith("http")) return;

  e.preventDefault();
  window.location.href = url;
});

