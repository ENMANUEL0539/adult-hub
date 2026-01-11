async function getPosts() {
  const res = await fetch('/data/posts.json');
  return await res.json();
}

async function renderList() {
  const posts = await getPosts();
  const container = document.getElementById('post-list');
  posts.forEach(p => {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
      <h2>${p.title}</h2>
      <p>${p.description}</p>
      <a href="/post.html?slug=${p.slug}" class="btn">Ver contenido</a>
    `;
    container.appendChild(div);
  });
}

async function loadPost() {
  const slug = new URLSearchParams(location.search).get('slug');
  const posts = await getPosts();
  const post = posts.find(p => p.slug === slug);
  if (!post) return;

  document.getElementById('title').innerText = post.title;
  document.getElementById('description').innerText = post.description;
  document.getElementById('content-frame').src = post.iframe;
  document.getElementById('buy').href = post.buy;
  document.getElementById('free').href = post.free;
}

if (document.getElementById('post-list')) {
  renderList();
}

