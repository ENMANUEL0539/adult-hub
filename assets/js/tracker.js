document.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    fetch('/.netlify/functions/track', {
      method: 'POST',
      body: JSON.stringify({
        url: link.href,
        time: Date.now()
      })
    });
  });
});

