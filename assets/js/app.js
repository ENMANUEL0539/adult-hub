// ===== CONFIGURACIÓN =====
const API_ENDPOINT = 'https://my-api-terabox.onrender.com/api/preview';
const IMAGE_PROXY_ENDPOINT = 'https://my-api-terabox.onrender.com/api/image';

// ===== LISTA DE CONTENIDO =====
const POSTS = [
  {
    slug: "pack-exclusivo-01",
    teraboxLink: "https://1024terabox.com/s/1VUHsbwXsOt7vz1VhH2sIAA"
  },
  {
    slug: "video-premium-01",
    teraboxLink: "https://1024terabox.com/s/1VUHsbwXsOt7vz1VhH2sIAA"
  },
  {
    slug: "galeria-fotos-01",
    teraboxLink: "https://1024terabox.com/s/1VUHsbwXsOt7vz1VhH2sIAA"
  }
  // ... añade más posts aquí
];

// ===== VARIABLES GLOBALES =====
const postList = document.getElementById('post-list');
const loadingIndicator = document.getElementById('loading-indicator');
const noResults = document.getElementById('no-results');
const ageVerificationModal = document.getElementById('age-verification');

// ===== INICIO =====
document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('ageVerified')) {
    showAgeVerification();
  } else {
    initApp();
  }
  setupEventListeners();
});

// ===== VERIFICACIÓN DE EDAD =====
function showAgeVerification() { ageVerificationModal.style.display = 'flex'; }
function hideAgeVerification() { ageVerificationModal.style.display = 'none'; }
function verifyAge() { localStorage.setItem('ageVerified', 'true'); hideAgeVerification(); initApp(); }
function denyAge() { window.location.href = 'https://www.google.com'; }

// ===== INICIALIZAR LA APP =====
function initApp() {
  try {
    showLoading();
    renderPosts(POSTS);
    hideLoading();
  } catch (error) {
    console.error('Error initializing app:', error);
    hideLoading();
    showError('No se pudo cargar el contenido. Por favor, inténtalo de nuevo más tarde.');
  }
}

// ===== RENDERIZAR POSTS (Página principal) =====
function renderPosts(postsToRender) {
  if (!postList) return;
  postList.innerHTML = '';
  if (postsToRender.length === 0) {
    if (noResults) noResults.style.display = 'flex';
    return;
  }
  if (noResults) noResults.style.display = 'none';

  postsToRender.forEach(post => {
    const card = createPostCardSkeleton(post);
    postList.appendChild(card);
    fetchAndPopulateCard(card, post);
  });
}

// ===== CREAR TARJETA VACÍA (con esqueleto de carga) =====
function createPostCardSkeleton(post) {
  const card = document.createElement('div');
  card.className = 'post-card';
  card.innerHTML = `
    <div class="post-card-image">
      <div class="skeleton-loader"></div>
    </div>
    <div class="post-card-content">
      <h3 class="post-card-title skeleton-text"></h3>
      <p class="post-card-description skeleton-text"></p>
      <a href="/post.html?slug=${encodeURIComponent(post.slug)}" class="btn btn-primary">
        Ver contenido
      </a>
    </div>
  `;
  return card;
}

// ===== OBTENER DATOS Y PINTAR TARJETA =====
async function fetchAndPopulateCard(cardElement, postData) {
  try {
    const response = await fetch(`${API_ENDPOINT}?url=${encodeURIComponent(postData.teraboxLink)}`);
    if (!response.ok) throw new Error(`Error del servidor: ${response.statusText}`);

    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Error al obtener datos');

    // Usar el proxy de imágenes para evitar CORB
    const imageUrl = data.image.includes('placehold.co') ? 
      data.image : 
      `${IMAGE_PROXY_ENDPOINT}?url=${encodeURIComponent(data.image)}`;

    const imageContainer = cardElement.querySelector('.post-card-image');
    imageContainer.innerHTML = `<img src="${imageUrl}" alt="${data.title}" loading="lazy">`;

    const titleElement = cardElement.querySelector('.post-card-title');
    titleElement.textContent = data.title;
    titleElement.classList.remove('skeleton-text');

    const descElement = cardElement.querySelector('.post-card-description');
    descElement.textContent = data.description;
    descElement.classList.remove('skeleton-text');

  } catch (error) {
    console.error(`Error al cargar datos para ${postData.slug}:`, error);
    const imageContainer = cardElement.querySelector('.post-card-image');
    imageContainer.innerHTML = `<img src="https://placehold.co/600x400@2x.png?text=Error+al+Cargar" alt="Error al cargar">`;
    
    const titleElement = cardElement.querySelector('.post-card-title');
    titleElement.textContent = 'No disponible';
    titleElement.classList.remove('skeleton-text');
    
    const descElement = cardElement.querySelector('.post-card-description');
    descElement.textContent = 'No se pudo cargar la descripción.';
    descElement.classList.remove('skeleton-text');
  }
}

// ===== CARGAR DETALLE DEL POST (Página individual) =====
async function loadPostDetail() {
  const slug = new URLSearchParams(window.location.search).get('slug');
  if (!slug) { showError('No se especificó ningún contenido.'); return; }

  const post = POSTS.find(p => p.slug === slug);
  if (!post) { showError('Contenido no encontrado.'); return; }

  try {
    showLoading();
    const response = await fetch(`${API_ENDPOINT}?url=${encodeURIComponent(post.teraboxLink)}`);
    if (!response.ok) throw new Error(`Error del servidor: ${response.statusText}`);
    
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Error al obtener vista previa');

    document.title = `${data.title} | Adult Hub`;
    document.getElementById('post-title').textContent = data.title;
    document.getElementById('post-description').textContent = data.description;
    
    // Usar el proxy de imágenes para evitar CORB
    const imageUrl = data.image.includes('placehold.co') ? 
      data.image : 
      `${IMAGE_PROXY_ENDPOINT}?url=${encodeURIComponent(data.image)}`;
    
    document.getElementById('preview-image').src = imageUrl;

    const teraboxLink = post.teraboxLink;
    document.getElementById('free-link').href = teraboxLink;
    document.getElementById('premium-link').href = teraboxLink;

    hideLoading();
    document.getElementById('post-content').style.display = 'block';

  } catch (error) {
    console.error('Error loading post detail:', error);
    hideLoading();
    showError(`No se pudo cargar el contenido: ${error.message}`);
  }
}

// ===== FUNCIONES AUXILIARES =====
function showLoading() { if (loadingIndicator) loadingIndicator.style.display = 'flex'; }
function hideLoading() { if (loadingIndicator) loadingIndicator.style.display = 'none'; }
function showError(message) { 
  const errorMessage = document.getElementById('error-message');
  if (errorMessage) {
    errorMessage.style.display = 'block';
    const errorText = errorMessage.querySelector('p');
    if (errorText) errorText.textContent = message;
  }
}
function setupEventListeners() {
  const confirmAgeBtn = document.getElementById('confirm-age');
  const denyAgeBtn = document.getElementById('deny-age');
  if (confirmAgeBtn) confirmAgeBtn.addEventListener('click', verifyAge);
  if (denyAgeBtn) denyAgeBtn.addEventListener('click', denyAge);
}

// Comprobar si estamos en la página de un post
if (window.location.pathname.includes('post.html')) {
  document.addEventListener('DOMContentLoaded', loadPostDetail);
}
