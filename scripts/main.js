
// Load header and footer
async function loadIncludes() {
  // Load header
  const headerPlaceholder = document.getElementById('header-placeholder');
  if (headerPlaceholder) {
    try {
      const headerResponse = await fetch('header.html');
      const headerHtml = await headerResponse.text();
      headerPlaceholder.innerHTML = headerHtml;
    } catch (error) {
      console.error('Error loading header:', error);
    }
  }

  // Load footer
  const footerPlaceholder = document.getElementById('footer-placeholder');
  if (footerPlaceholder) {
    try {
      const footerResponse = await fetch('footer.html');
      const footerHtml = await footerResponse.text();
      footerPlaceholder.innerHTML = footerHtml;
    } catch (error) {
      console.error('Error loading footer:', error);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Load header and footer
  loadIncludes();

  const yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Smooth scroll for internal links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
});
