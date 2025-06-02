// Controle do menu móvel
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

menuToggle.addEventListener('click', () => {
  navLinks.classList.toggle('show');
});

// Botão voltar ao topo
const btnTopo = document.querySelector('.btn-topo');

window.addEventListener('scroll', () => {
  if (window.scrollY > 300) {
    document.body.classList.add('scrolled');
  } else {
    document.body.classList.remove('scrolled');
  }
});

btnTopo.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
});

// Acessibilidade - Menu fixo e modo escuro
const acessibilidadeBtn = document.getElementById('acessibilidade-btn');
const acessibilidadeMenu = document.getElementById('acessibilidade-menu');
const darkModeBtn = document.getElementById('dark-mode-btn');

acessibilidadeBtn.addEventListener('click', () => {
  if (acessibilidadeMenu.style.display === 'flex') {
    acessibilidadeMenu.style.display = 'none';
  } else {
    acessibilidadeMenu.style.display = 'flex';
  }
});

darkModeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark-theme');
});
