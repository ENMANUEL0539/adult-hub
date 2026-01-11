async function getPosts() {
  try {
    const res = await fetch('./data/posts.json', {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error('No se pudo cargar posts.json');
    }

    return await res.json();
  } catch (e) {
    console.error('Error cargando posts:', e);
    return [];
  }
}

/* =========================
   LISTADO (INDEX)
========================= */
async function renderList() {
  const container = document.getElementById('post-list');
  if (!container) return;

  const posts = await getPosts();
  container.innerHTML = '';

  posts.forEach(p => {
    const card = document.createElement('div');
    card.className = 'card';

    card.innerHTML = `
      <h2>${p.title}</h2>
      <p>${p.description}</p>
      <a class="btn" href="./post.html?slug=${encodeURIComponent(p.slug)}">
        Ver contenido
      </a>
    `;

    container.appendChild(card);
  });
}

/* =========================
   POST INDIVIDUAL
========================= */
async function loadPost() {
  const titleEl = document.getElementById('title');
  const descEl = document.getElementById('description');
  const previewEl = document.getElementById('preview');
  const buyEl = document.getElementById('buy');
  const freeEl = document.getElementById('free');

  if (!titleEl || !descEl || !previewEl) return;

  const slug = new URLSearchParams(window.location.search).get('slug');
  if (!slug) return;

  const posts = await getPosts();
  const post = posts.find(p => p.slug === slug);

  if (!post) {
    titleEl.innerText = 'Contenido no encontrado';
    return;
  }

  titleEl.innerText = post.title;
  descEl.innerText = post.description;

  buyEl.href = post.buy;
  freeEl.href = post.free;

  /* PREVIEW AUTOMÁTICO */
  try {
    const res = await fetch(
      `/functions/preview?url=${encodeURIComponent(post.free)}`
    );
    const data = await res.json();
    if (data.image) {
      previewEl.src = data.image;
    }
  } catch (e) {
    console.warn('No se pudo cargar preview');
  }
}

/* =========================
   AUTO INIT
========================= */
document.addEventListener('DOMContentLoaded', () => {
  renderList();
  loadPost();
});
