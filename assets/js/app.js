// ===== GLOBAL VARIABLES =====
const API_BASE_URL = '/.netlify/functions';
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
// Reemplaza la función fetchAndPopulateCard existente por esta
async function fetchAndPopulateCard(cardElement, postData) {
  try {
    const response = await fetch(`${API_BASE_URL}/preview?url=${encodeURIComponent(postData.teraboxLink)}`);

    // 1. Comprobar si la respuesta es OK (status 200-299)
    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
    }

    // 2. Comprobar si el contenido es realmente JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      // Si no es JSON, probablemente es HTML (página de error)
      const text = await response.text();
      console.error("Respuesta no JSON recibida:", text.substring(0, 200));
      throw new Error("El servidor devolvió una página HTML en lugar de datos. ¿Está la función de Netlify bien configurada?");
    }

    // 3. Si todo está bien, parsear el JSON
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Error desconocido al obtener datos de la API');
    }

    // Actualizar la tarjeta con los datos obtenidos (sin cambios aquí)
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
    // Mostrar un estado de error más informativo en la tarjeta
     // Mostrar un estado de error en la tarjeta
    const imageContainer = cardElement.querySelector('.post-card-image');
    imageContainer.innerHTML = `<div class="preview-error"><i class="fas fa-exclamation-triangle"></i><p>Error de API</p></div>`;
    
    const titleElement = cardElement.querySelector('.post-card-title');
    titleElement.textContent = postData.customTitle || 'Error al cargar';
    titleElement.classList.remove('skeleton-text');
    
    const descElement = cardElement.querySelector('.post-card-description');
    descElement.textContent = error.message; // Muestra el error real
    descElement.classList.remove('skeleton-text');
  }
}

// Y también la función loadPostDetail
// ===== LOAD POST DETAIL (Página individual) ====
async function loadPostDetail() {
  const slug = new URLSearchParams(window.location.search).get('slug');
  if (!slug) { showError('No se especificó ningún contenido.'); return; }

  try {
    showLoading();
    if (posts.length === 0) posts = await fetchPosts();

    const post = posts.find(p => p.slug === slug);
    if (!post) throw new Error('Post not found');

    const response = await fetch(`${API_BASE_URL}/preview?url=${encodeURIComponent(post.teraboxLink)}`);
    
    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Error de configuración de la función en el servidor.");
    }
    
    // 1. Obtener datos del enlace de TeraBox
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Error al obtener vista previa');

    // El resto de la función sigue igual...
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
    showError(`No se pudo cargar el contenido. El enlace podría no estar disponible: ${error.message}`);
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
