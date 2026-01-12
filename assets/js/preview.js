// ===== PREVIEW LOADING =====
document.addEventListener('DOMContentLoaded', () => {
  // Check if we're on a post page
  if (window.location.pathname.includes('post.html')) {
    loadPreview();
    
    // Set up retry button
    const retryButton = document.getElementById('retry-preview');
    if (retryButton) {
      retryButton.addEventListener('click', loadPreview);
    }
  }
});

// ===== LOAD PREVIEW =====
async function loadPreview() {
  const slug = new URLSearchParams(window.location.search).get('slug');
  if (!slug) return;
  
  try {
    // Show loading
    showPreviewLoading();
    
    // Get post data
    const posts = await fetchPosts();
    const post = posts.find(p => p.slug === slug);
    if (!post) return;
    
    // Try to get preview from API
    const previewUrl = post.free || post.premium || post.buy;
    if (!previewUrl) {
      showPreviewError();
      return;
    }
    
    // Fetch preview
    const response = await fetch(`${API_BASE_URL}/preview?url=${encodeURIComponent(previewUrl)}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.image) {
      showPreviewImage(data.image);
    } else {
      showPreviewError();
    }
  } catch (error) {
    console.error('Error loading preview:', error);
    showPreviewError();
  }
}

// ===== SHOW PREVIEW LOADING =====
function showPreviewLoading() {
  const loadingElement = document.getElementById('preview-loading');
  const imageElement = document.getElementById('preview-image');
  const errorElement = document.getElementById('preview-error');
  
  if (loadingElement) loadingElement.style.display = 'flex';
  if (imageElement) imageElement.style.display = 'none';
  if (errorElement) errorElement.style.display = 'none';
}

// ===== SHOW PREVIEW IMAGE =====
function showPreviewImage(imageUrl) {
  const loadingElement = document.getElementById('preview-loading');
  const imageElement = document.getElementById('preview-image');
  const errorElement = document.getElementById('preview-error');
  
  if (loadingElement) loadingElement.style.display = 'none';
  if (errorElement) errorElement.style.display = 'none';
  
  if (imageElement) {
    imageElement.src = imageUrl;
    imageElement.style.display = 'block';
    
    // Handle image load error
    imageElement.onerror = () => {
      showPreviewError();
    };
  }
}

// ===== SHOW PREVIEW ERROR =====
function showPreviewError() {
  const loadingElement = document.getElementById('preview-loading');
  const imageElement = document.getElementById('preview-image');
  const errorElement = document.getElementById('preview-error');
  
  if (loadingElement) loadingElement.style.display = 'none';
  if (imageElement) imageElement.style.display = 'none';
  
  if (errorElement) errorElement.style.display = 'flex';
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

// ===== EXPORT FUNCTIONS =====
window.loadPreview = loadPreview;
