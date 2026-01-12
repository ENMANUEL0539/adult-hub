// ===== GLOBAL VARIABLES =====
const API_BASE_URL = '/.netlify/functions';
let posts = [];
let currentFilter = 'all';

// ===== DOM ELEMENTS =====
const postList = document.getElementById('post-list');
const loadingIndicator = document.getElementById('loading-indicator');
const noResults = document.getElementById('no-results');
const filterButtons = document.querySelectorAll('.filter-btn');
const ageVerificationModal = document.getElementById('age-verification');
const confirmAgeBtn = document.getElementById('confirm-age');
const denyAgeBtn = document.getElementById('deny-age');

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  // Check if user has verified age
  if (!localStorage.getItem('ageVerified')) {
    showAgeVerification();
  } else {
    initApp();
  }
  
  // Set up event listeners
  setupEventListeners();
});

// ===== AGE VERIFICATION =====
function showAgeVerification() {
  ageVerificationModal.style.display = 'flex';
}

function hideAgeVerification() {
  ageVerificationModal.style.display = 'none';
}

function verifyAge() {
  localStorage.setItem('ageVerified', 'true');
  hideAgeVerification();
  initApp();
}

function denyAge() {
  // Redirect to a safe site
  window.location.href = 'https://www.google.com';
}

// ===== INIT APP =====
async function initApp() {
  try {
    // Show loading indicator
    if (loadingIndicator) loadingIndicator.style.display = 'flex';
    
    // Fetch posts
    posts = await fetchPosts();
    
    // Render posts
    renderPosts(posts);
    
    // Hide loading indicator
    if (loadingIndicator) loadingIndicator.style.display = 'none';
  } catch (error) {
    console.error('Error initializing app:', error);
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    showError('No se pudo cargar el contenido. Por favor, inténtalo de nuevo más tarde.');
  }
}

// ===== FETCH POSTS =====
async function fetchPosts() {
  try {
    const response = await fetch('/assets/data/posts.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
}

// ===== RENDER POSTS =====
function renderPosts(postsToRender) {
  if (!postList) return;
  
  // Clear current posts
  postList.innerHTML = '';
  
  // Check if there are posts to render
  if (postsToRender.length === 0) {
    if (noResults) noResults.style.display = 'flex';
    return;
  }
  
  // Hide no results message
  if (noResults) noResults.style.display = 'none';
  
  // Create and append post cards
  postsToRender.forEach(post => {
    const postCard = createPostCard(post);
    postList.appendChild(postCard);
  });
}

// ===== CREATE POST CARD =====
function createPostCard(post) {
  const card = document.createElement('div');
  card.className = 'post-card';
  
  // Format date
  const date = new Date(post.date || Date.now());
  const formattedDate = date.toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
  
  card.innerHTML = `
    <div class="post-card-image">
      <img src="${post.image || '/assets/img/placeholder.jpg'}" alt="${post.title}" loading="lazy">
      <span class="post-card-category">${post.category || 'General'}</span>
    </div>
    <div class="post-card-content">
      <h3 class="post-card-title">${post.title}</h3>
      <p class="post-card-description">${post.description}</p>
      <div class="post-card-meta">
        <span class="post-card-date">${formattedDate}</span>
        <span class="post-card-views">
          <i class="fas fa-eye"></i> ${post.views || 0}
        </span>
      </div>
      <a href="/post.html?slug=${encodeURIComponent(post.slug)}" class="btn btn-primary">
        Ver contenido
      </a>
    </div>
  `;
  
  return card;
}

// ===== FILTER POSTS =====
function filterPosts(category) {
  currentFilter = category;
  
  // Update active button
  filterButtons.forEach(btn => {
    if (btn.dataset.filter === category) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // Filter posts
  let filteredPosts = posts;
  if (category !== 'all') {
    filteredPosts = posts.filter(post => post.category === category);
  }
  
  // Render filtered posts
  renderPosts(filteredPosts);
}

// ===== LOAD POST DETAIL =====
async function loadPostDetail() {
  const slug = new URLSearchParams(window.location.search).get('slug');
  if (!slug) {
    showError('No se especificó ningún contenido.');
    return;
  }
  
  try {
    // Show loading indicator
    if (loadingIndicator) loadingIndicator.style.display = 'flex';
    
    // Fetch posts
    if (posts.length === 0) {
      posts = await fetchPosts();
    }
    
    // Find the post
    const post = posts.find(p => p.slug === slug);
    if (!post) {
      throw new Error('Post not found');
    }
    
    // Update page metadata
    updatePageMetadata(post);
    
    // Render post detail
    renderPostDetail(post);
    
    // Load related posts
    loadRelatedPosts(post);
    
    // Hide loading indicator
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    
    // Show post content
    const postContent = document.getElementById('post-content');
    if (postContent) postContent.style.display = 'block';
    
    // Track view
    trackView(post.slug);
  } catch (error) {
    console.error('Error loading post detail:', error);
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    showError('No se pudo cargar el contenido. Por favor, inténtalo de nuevo más tarde.');
  }
}

// ===== UPDATE PAGE METADATA =====
function updatePageMetadata(post) {
  // Update title
  const pageTitle = document.getElementById('page-title');
  if (pageTitle) pageTitle.textContent = `${post.title} | Adult Hub`;
  
  // Update Open Graph tags
  const ogTitle = document.getElementById('og-title');
  if (ogTitle) ogTitle.content = post.title;
  
  const ogDescription = document.getElementById('og-description');
  if (ogDescription) ogDescription.content = post.description;
  
  const ogImage = document.getElementById('og-image');
  if (ogImage && post.image) ogImage.content = post.image;
}

// ===== RENDER POST DETAIL =====
function renderPostDetail(post) {
  // Format date
  const date = new Date(post.date || Date.now());
  const formattedDate = date.toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Update post elements
  const titleElement = document.getElementById('post-title');
  if (titleElement) titleElement.textContent = post.title;
  
  const categoryElement = document.getElementById('post-category');
  if (categoryElement) categoryElement.textContent = post.category || 'General';
  
  const dateElement = document.getElementById('post-date');
  if (dateElement) dateElement.textContent = formattedDate;
  
  const descriptionElement = document.getElementById('post-description');
  if (descriptionElement) descriptionElement.textContent = post.description;
  
  // Update action buttons
  const freeLink = document.getElementById('free-link');
  if (freeLink) {
    freeLink.href = post.free || '#';
    freeLink.setAttribute('data-track', 'free');
  }
  
  const premiumLink = document.getElementById('premium-link');
  if (premiumLink) {
    premiumLink.href = post.premium || post.buy || '#';
    premiumLink.setAttribute('data-track', 'premium');
  }
  
  // Update post info
  const formatElement = document.getElementById('content-format');
  if (formatElement) formatElement.textContent = post.format || 'Desconocido';
  
  const sizeElement = document.getElementById('content-size');
  if (sizeElement) sizeElement.textContent = post.size || 'Desconocido';
  
  const viewsElement = document.getElementById('content-views');
  if (viewsElement) viewsElement.textContent = post.views || 0;
}

// ===== LOAD RELATED POSTS =====
function loadRelatedPosts(currentPost) {
  const relatedPostsContainer = document.getElementById('related-posts');
  if (!relatedPostsContainer) return;
  
  // Find related posts (same category, excluding current post)
  const relatedPosts = posts
    .filter(post => post.category === currentPost.category && post.slug !== currentPost.slug)
    .slice(0, 4); // Limit to 4 related posts
  
  // Clear container
  relatedPostsContainer.innerHTML = '';
  
  // If no related posts, hide the section
  if (relatedPosts.length === 0) {
    const relatedContent = document.querySelector('.related-content');
    if (relatedContent) relatedContent.style.display = 'none';
    return;
  }
  
  // Create and append related post cards
  relatedPosts.forEach(post => {
    const relatedCard = createRelatedCard(post);
    relatedPostsContainer.appendChild(relatedCard);
  });
}

// ===== CREATE RELATED CARD =====
function createRelatedCard(post) {
  const card = document.createElement('div');
  card.className = 'related-card';
  
  card.innerHTML = `
    <div class="related-card-image">
      <img src="${post.image || '/assets/img/placeholder.jpg'}" alt="${post.title}" loading="lazy">
    </div>
    <div class="related-card-content">
      <h4 class="related-card-title">${post.title}</h4>
      <span class="related-card-category">${post.category || 'General'}</span>
    </div>
  `;
  
  // Add click event to navigate to post
  card.addEventListener('click', () => {
    window.location.href = `/post.html?slug=${encodeURIComponent(post.slug)}`;
  });
  
  return card;
}

// ===== TRACK VIEW =====
function trackView(slug) {
  try {
    fetch(`${API_BASE_URL}/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'view',
        slug: slug,
        timestamp: Date.now()
      })
    }).catch(error => {
      console.error('Error tracking view:', error);
    });
  } catch (error) {
    console.error('Error tracking view:', error);
  }
}

// ===== TRACK CLICK =====
function trackClick(type, slug) {
  try {
    fetch(`${API_BASE_URL}/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'click',
        type: type,
        slug: slug,
        timestamp: Date.now()
      })
    }).catch(error => {
      console.error('Error tracking click:', error);
    });
  } catch (error) {
    console.error('Error tracking click:', error);
  }
}

// ===== SHOW ERROR =====
function showError(message) {
  const errorMessage = document.getElementById('error-message');
  if (errorMessage) {
    errorMessage.style.display = 'block';
    const errorText = errorMessage.querySelector('p');
    if (errorText) errorText.textContent = message;
  }
}

// ===== SETUP EVENT LISTENERS =====
function setupEventListeners() {
  // Age verification buttons
  if (confirmAgeBtn) {
    confirmAgeBtn.addEventListener('click', verifyAge);
  }
  
  if (denyAgeBtn) {
    denyAgeBtn.addEventListener('click', denyAge);
  }
  
  // Filter buttons
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      filterPosts(button.dataset.filter);
    });
  });
  
  // Track clicks on action buttons
  document.addEventListener('click', (event) => {
    const target = event.target.closest('.btn');
    if (target && target.hasAttribute('data-track')) {
      const type = target.getAttribute('data-track');
      const slug = new URLSearchParams(window.location.search).get('slug');
      if (slug) {
        trackClick(type, slug);
      }
    }
  });
  
  // Check if we're on a post page
  if (window.location.pathname.includes('post.html')) {
    loadPostDetail();
  }
}

// ===== EXPORT FUNCTIONS =====
window.filterPosts = filterPosts;
window.loadPostDetail = loadPostDetail;
