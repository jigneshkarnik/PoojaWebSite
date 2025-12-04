
// Load header and footer
async function loadIncludes() {
  // Load header
  const headerPlaceholder = document.getElementById('header-placeholder');
  if (headerPlaceholder) {
    try {
      const headerResponse = await fetch('header.html');
      const headerHtml = await headerResponse.text();
      headerPlaceholder.innerHTML = headerHtml;
      
      // Initialize mobile menu after header is loaded
      initializeMobileMenu();
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

// Initialize mobile menu toggle
function initializeMobileMenu() {
  const mobileMenuButton = document.getElementById('mobile-menu-toggle');
  const mainNav = document.getElementById('main-nav');
  
  if (mobileMenuButton && mainNav) {
    mobileMenuButton.addEventListener('click', () => {
      mainNav.classList.toggle('active');
      const isActive = mainNav.classList.contains('active');
      mobileMenuButton.setAttribute('aria-expanded', isActive);
      mobileMenuButton.textContent = isActive ? '✕' : '☰';
    });
    
    // Close menu when clicking on a link
    const navLinks = mainNav.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('active');
        mobileMenuButton.setAttribute('aria-expanded', 'false');
        mobileMenuButton.textContent = '☰';
      });
    });
  }
  
  // Set active nav item based on current page
  setActiveNavItem();
}

// Set active navigation item based on current page
function setActiveNavItem() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.main-nav a');
  
  navLinks.forEach(link => {
    link.classList.remove('nav-active');
    const linkPage = link.getAttribute('href');
    
    // Match current page with link
    if (linkPage === currentPage || 
        (currentPage === '' && linkPage === 'index.html') ||
        (currentPage === 'index.html' && linkPage === 'index.html') ||
        (currentPage === 'homoeopathy.html' && linkPage === 'homoeopathy.html')) {
      link.classList.add('nav-active');
    }
  });
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
