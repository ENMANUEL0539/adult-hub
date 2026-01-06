(function () {
  if (!localStorage.getItem("adult_ok")) {
    document.body.innerHTML = `
      <div class="age-gate">
        <h1>+18 ADULTS ONLY</h1>
        <p>Este sitio contiene material solo para adultos.</p>
        <button onclick="accept()">Tengo 18+</button>
        <button onclick="leave()">Salir</button>
      </div>
    `;
  }
})();

function accept() {
  localStorage.setItem("adult_ok", "yes");
  location.reload();
}

function leave() {
  window.location.href = "https://www.google.com";
}

