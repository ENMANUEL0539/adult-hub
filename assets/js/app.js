// ===== GLOBAL VARIABLES =====
const API_BASE_URL = '/functions';
let posts = []; // Almacenará los datos de posts.json

// ===== DOM ELEMENTS =====
const postList = document.getElementById('post-list');
const loadingIndicator = document.getElementById('loading-indicator');
const noResults = document.getElementById('no-results');
const ageVerificationModal = document.getElementById('age-verification');

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('ageVerified')) {
    showAgeVerification();
  } else {
    initApp();
  }
  setupEventListeners();
});

// ===== AGE VERIFICATION (Sin cambios) =====
function showAgeVerification() { ageVerificationModal.style.display = 'flex'; }
function hideAgeVerification() { ageVerificationModal.style.display = 'none'; }
function verifyAge() { localStorage.setItem('ageVerified', 'true'); hideAgeVerification(); initApp(); }
function denyAge() { window.location.href = 'https://www.google.com'; }

// ===== INIT APP =====
async function initApp() {
  try {
    showLoading();
    posts = await fetchPosts();
    renderPosts(posts);
    hideLoading();
  } catch (error) {
    console.error('Error initializing app:', error);
    hideLoading();
    showError('No se pudo cargar el contenido. Por favor, inténtalo de nuevo más tarde.');
  }
}

// ===== FETCH POSTS =====
// Ahora solo obtiene el JSON simple con los enlaces
async function fetchPosts() {
  const response = await fetch('/assets/data/posts.json');
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
}

// ===== RENDER POSTS (Página principal) =====
function renderPosts(postsToRender) {
  if (!postList) return;
  postList.innerHTML = '';
  if (postsToRender.length === 0) {
    if (noResults) noResults.style.display = 'flex';
    return;
  }
  if (noResults) noResults.style.display = 'none';

  postsToRender.forEach(post => {
    const card = createPostCardSkeleton(post); // Crea una tarjeta "vacía" con un esqueleto de carga
    postList.appendChild(card);
    fetchAndPopulateCard(card, post); // Llama a la API para llenar la tarjeta
  });
}

// ===== CREATE POST CARD SKELETON =====
// Crea la estructura HTML de la tarjeta con placeholders
function createPostCardSkeleton(post) {
  const card = document.createElement('div');
  card.className = 'post-card';
  card.innerHTML = `
    <div class="post-card-image">
      <div class="skeleton-loader"></div> <!-- Esqueleto para la imagen -->
    </div>
    <div class="post-card-content">
      <h3 class="post-card-title skeleton-text"></h3> <!-- Esqueleto para el título -->
      <p class="post-card-description skeleton-text"></p> <!-- Esqueleto para la descripción -->
      <a href="/post.html?slug=${encodeURIComponent(post.slug)}" class="btn btn-primary">
        Ver contenido
      </a>
    </div>
  `;
  return card;
}

// ===== FETCH AND POPULATE CARD =====
// Función clave: obtiene los datos de TeraBox y los pinta en la tarjeta
async function fetchAndPopulateCard(cardElement, postData) {
  try {
    const response = await fetch(`${API_BASE_URL}/preview?url=${encodeURIComponent(postData.teraboxLink)}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Error desconocido');
    }

    // Actualizar la tarjeta con los datos obtenidos
    const imageContainer = cardElement.querySelector('.post-card-image');
    imageContainer.innerHTML = `<img src="${data.image}" alt="${data.title}" loading="lazy">`;

    const titleElement = cardElement.querySelector('.post-card-title');
    titleElement.textContent = postData.customTitle || data.title;
    titleElement.classList.remove('skeleton-text');

    const descElement = cardElement.querySelector('.post-card-description');
    descElement.textContent = data.description;
    descElement.classList.remove('skeleton-text');

  } catch (error) {
    console.error(`Error al cargar datos para ${postData.slug}:`, error);
    // Mostrar un estado de error en la tarjeta
    const imageContainer = cardElement.querySelector('.post-card-image');
    imageContainer.innerHTML = `<div class="preview-error"><i class="fas fa-exclamation-triangle"></i><p>Error al cargar</p></div>`;
    
    const titleElement = cardElement.querySelector('.post-card-title');
    titleElement.textContent = postData.customTitle || 'No disponible';
    titleElement.classList.remove('skeleton-text');
    
    const descElement = cardElement.querySelector('.post-card-description');
    descElement.textContent = 'No se pudo cargar la descripción.';
    descElement.classList.remove('skeleton-text');
  }
}

// ===== LOAD POST DETAIL (Página individual) =====
async function loadPostDetail() {
  const slug = new URLSearchParams(window.location.search).get('slug');
  if (!slug) { showError('No se especificó ningún contenido.'); return; }

  try {
    showLoading();
    if (posts.length === 0) posts = await fetchPosts();

    const post = posts.find(p => p.slug === slug);
    if (!post) throw new Error('Post not found');

    // 1. Obtener datos del enlace de TeraBox
    const response = await fetch(`${API_BASE_URL}/preview?url=${encodeURIComponent(post.teraboxLink)}`);
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Error al obtener vista previa');

    // 2. Pintar los datos en la página
    document.title = `${data.title} | Adult Hub`;
    document.getElementById('post-title').textContent = data.title;
    document.getElementById('post-description').textContent = data.description;
    document.getElementById('preview-image').src = data.image;

    // 3. Configurar los botones para que apunten al enlace de TeraBox
    const teraboxLink = post.teraboxLink;
    document.getElementById('free-link').href = teraboxLink;
    document.getElementById('premium-link').href = teraboxLink;

    hideLoading();
    document.getElementById('post-content').style.display = 'block';

  } catch (error) {
    console.error('Error loading post detail:', error);
    hideLoading();
    showError('No se pudo cargar el contenido. El enlace podría no estar disponible.');
  }
}

// ===== FUNCIONES AUXILIARES (Sin cambios) =====
function showLoading() { if (loadingIndicator) loadingIndicator.style.display = 'flex'; }
function hideLoading() { if (loadingIndicator) loadingIndicator.style.display = 'none'; }
function showError(message) { /* ... lógica para mostrar error ... */ }
function setupEventListeners() { /* ... lógica de event listeners ... */ }

// Comprobar si estamos en la página de un post
if (window.location.pathname.includes('post.html')) {
  document.addEventListener('DOMContentLoaded', loadPostDetail);
}
