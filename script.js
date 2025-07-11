document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos DOM ---
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const btnTopo = document.querySelector('.btn-topo');
    const acessibilidadeBtn = document.getElementById('acessibilidade-btn');
    const acessibilidadeMenu = document.getElementById('acessibilidade-menu');
    const btnAumentarFonte = document.getElementById('btn-aumentar-fonte');
    const btnDiminuirFonte = document.getElementById('btn-diminuir-fonte');
    const btnToggleTema = document.getElementById('btn-toggle-tema');
    const btnAltoContraste = document.getElementById('btn-alto-contraste');
    const btnLerTexto = document.getElementById('btn-ler-texto');
    const btnPararLeitura = document.getElementById('btn-parar-leitura');

    const quizForm = document.getElementById('quiz-form');
    const quizResult = document.getElementById('quiz-result');
    const contactForm = document.getElementById('contact-form');
    const loadingSpinner = document.getElementById('loading-spinner');

    const skipLink = document.querySelector('.skip-link'); // Link "Pular para o conteúdo principal"
    const mainContent = document.querySelector('main'); // Tag principal (assumindo id="main-content" no HTML)

    // O botão 'explore a conexão' e sua funcionalidade foram removidos conforme solicitação.

    // --- Configurações Iniciais ---
    let currentFontSize = parseInt(localStorage.getItem('fontSize')) || 16; // Tamanho de fonte base em px
    const FONT_SIZE_STEP = 2; // Passo para aumentar/diminuir a fonte

    // --- Web Speech API para Leitura de Texto ---
    const synth = window.speechSynthesis;
    let utterance = new SpeechSynthesisUtterance();

    utterance.lang = 'pt-BR'; // Definir o idioma para Português do Brasil
    utterance.volume = 1; // 0 to 1
    utterance.rate = 1; // 0.1 to 10 (velocidade padrão)
    utterance.pitch = 1; // 0 to 2 (tom padrão)

    /**
     * Coleta o texto principal da página para ser lido.
     * Exclui elementos de navegação, scripts e elementos ocultos.
     * @returns {string} O texto concatenado da página.
     */
    function getTextToRead() {
        let text = '';
        const mainContent = document.querySelector('main');
        if (mainContent) {
            // Seleciona elementos de texto relevantes dentro do 'main'
            // Exclui elementos de formulário e outros que não devem ser lidos continuamente
            const textElements = mainContent.querySelectorAll('h1, h2, h3, p:not(.hidden-content), li, strong, em'); // IGNORA .hidden-content
            textElements.forEach(element => {
                // Verifica se o elemento está visível e não é parte de um formulário interativo
                if (element.offsetParent !== null && !element.hasAttribute('aria-hidden') &&
                    !element.closest('#quiz-form') && !element.closest('#contact-form') &&
                    !element.closest('#custom-modal')) { // Exclui texto do modal
                    text += element.textContent + '. '; // Adiciona um ponto para pausas naturais
                }
            });
        }
        return text.trim(); // Remove espaços em branco extras no início/fim
    }

    /**
     * Inicia a leitura do texto da página.
     */
    function startReading() {
        if (!synth) {
            console.error('Web Speech API não suportada neste navegador.');
            displayModal('Erro: A leitura de texto não é suportada no seu navegador.', 'error');
            return;
        }

        if (synth.speaking) {
            synth.cancel();
        }

        const text = getTextToRead();
        if (text) {
            utterance.text = text;
            synth.speak(utterance);
            btnLerTexto.disabled = true;
            btnPararLeitura.disabled = false;
        } else {
            console.warn('Nenhum texto encontrado para ler.');
            displayModal('Nenhum texto principal encontrado para ler nesta página.', 'info');
        }
    }

    /**
     * Para a leitura do texto em andamento.
     */
    function stopReading() {
        if (synth.speaking) {
            synth.cancel();
        }
        btnLerTexto.disabled = false;
        btnPararLeitura.disabled = true;
    }

    // Event listener para quando a leitura termina
    utterance.onend = () => {
        btnLerTexto.disabled = false;
        btnPararLeitura.disabled = true;
    };

    /**
     * Exibe um modal customizado com uma mensagem e um tipo (sucesso, erro, info).
     * @param {string} message A mensagem a ser exibida no modal.
     * @param {string} type O tipo de mensagem ('success', 'error', 'info').
     * @param {number} [autoCloseDelay=0] Opcional. Atraso em milissegundos para fechar o modal automaticamente. 0 para não fechar automaticamente.
     */
    function displayModal(message, type = 'info', autoCloseDelay = 0) {
        // Cria o modal se não existir
        let modal = document.getElementById('custom-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'custom-modal';
            modal.innerHTML = `
                <i class="modal-icon fas"></i>
                <p id="modal-message"></p>
                <button aria-label="Fechar mensagem">Fechar</button>
            `;
            document.body.appendChild(modal);
        }

        const modalMessage = document.getElementById('modal-message');
        const modalIcon = modal.querySelector('.modal-icon');
        const closeButton = modal.querySelector('button');

        modalMessage.textContent = message;
        modal.setAttribute('data-type', type); // Define o tipo para CSS

        // Define o ícone com base no tipo
        modalIcon.className = 'modal-icon fas'; // Reseta e adiciona classes base
        if (type === 'success') {
            modalIcon.classList.add('fa-check-circle');
            modalIcon.setAttribute('aria-hidden', 'true'); // Oculta para leitores de tela se o texto já descreve
        } else if (type === 'error') {
            modalIcon.classList.add('fa-times-circle');
            modalIcon.setAttribute('aria-hidden', 'true');
        } else if (type === 'info') {
            modalIcon.classList.add('fa-info-circle');
            modalIcon.setAttribute('aria-hidden', 'true');
        }

        modal.style.opacity = '1';
        modal.style.visibility = 'visible';
        modal.setAttribute('aria-modal', 'true'); // Indica que é um modal
        modal.setAttribute('role', 'dialog'); // Define o papel como diálogo
        modal.setAttribute('aria-labelledby', 'modal-message'); // Associa ao título da mensagem

        // Garante que o foco seja travado dentro do modal
        const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const firstFocusableElement = focusableElements[0];
        const lastFocusableElement = focusableElements[focusableElements.length - 1];

        // Foca no botão de fechar por padrão
        closeButton.focus();

        function trapFocus(e) {
            if (e.key === 'Tab') {
                if (e.shiftKey) { // Se Shift + Tab
                    if (document.activeElement === firstFocusableElement) {
                        lastFocusableElement.focus();
                        e.preventDefault();
                    }
                } else { // Se Tab
                    if (document.activeElement === lastFocusableElement) {
                        firstFocusableElement.focus();
                        e.preventDefault();
                    }
                }
            }
            if (e.key === 'Escape') {
                closeModal();
            }
        }

        modal.addEventListener('keydown', trapFocus);

        let autoCloseTimeout;
        if (autoCloseDelay > 0) {
            autoCloseTimeout = setTimeout(closeModal, autoCloseDelay);
        }

        function closeModal() {
            modal.style.opacity = '0';
            modal.style.visibility = 'hidden';
            modal.removeAttribute('data-type');
            modal.removeAttribute('aria-modal');
            modal.removeAttribute('role');
            modal.removeAttribute('aria-labelledby');
            modal.removeEventListener('keydown', trapFocus); // Remove o event listener
            // Remove o ícone ao fechar
            if (modalIcon) {
                modalIcon.className = 'modal-icon'; // Reseta as classes do ícone
            }
            if (autoCloseTimeout) {
                clearTimeout(autoCloseTimeout); // Limpa o timeout de auto-fechamento se fechado manualmente
            }
        }

        closeButton.addEventListener('click', closeModal);
    }

    /**
     * Exibe uma mensagem de erro abaixo do campo do formulário.
     * @param {HTMLElement} element O elemento de input/textarea ou legend para grupos de rádio.
     * @param {string} message A mensagem de erro a ser exibida.
     * @param {string} [errorId] Opcional. ID para a mensagem de erro (usado para quiz).
     */
    function showInlineError(element, message, errorId = `${element.id || 'form-field'}-error`) {
        const errorMessageSpan = document.createElement('span');
        errorMessageSpan.classList.add('error-message');
        errorMessageSpan.textContent = message;
        errorMessageSpan.id = errorId; // Define o ID para aria-describedby

        // Para inputs de rádio, a mensagem de erro deve ir após o fieldset ou legend
        if (element.type === 'radio' || element.tagName === 'LEGEND') {
            const fieldset = element.closest('fieldset');
            if (fieldset) {
                // Verifica se uma mensagem de erro para este fieldset já existe
                const existingError = fieldset.querySelector(`#${errorId}`);
                if (!existingError) {
                    fieldset.insertBefore(errorMessageSpan, element.nextSibling); // Insere após o legend
                }
            }
            // Marca o primeiro input de rádio no grupo como inválido para ARIA
            const firstRadio = fieldset.querySelector('input[type="radio"]');
            if (firstRadio) {
                firstRadio.setAttribute('aria-invalid', 'true');
                firstRadio.setAttribute('aria-describedby', errorId);
            }
        } else {
            element.parentNode.insertBefore(errorMessageSpan, element.nextSibling);
            element.classList.add('is-invalid'); // Adiciona classe de erro visual ao input
            element.setAttribute('aria-invalid', 'true'); // Acessibilidade: indica campo inválido
            element.setAttribute('aria-describedby', errorId); // Associa o erro ao campo
        }
    }


    // --- Funções de Acessibilidade e Tema ---

    /**
     * Aplica o tema (claro/escuro) salvo no localStorage ou o tema padrão.
     */
    function applySavedTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            btnToggleTema.setAttribute('aria-pressed', 'true');
        } else {
            document.body.classList.remove('dark-theme');
            btnToggleTema.setAttribute('aria-pressed', 'false');
        }
    }

    /**
     * Aplica o modo de alto contraste salvo no localStorage ou o padrão.
     */
    function applySavedContrast() {
        const savedContrast = localStorage.getItem('highContrast');
        if (savedContrast === 'true') {
            document.body.classList.add('high-contrast');
            btnAltoContraste.setAttribute('aria-pressed', 'true');
        } else {
            document.body.classList.remove('high-contrast');
            btnAltoContraste.setAttribute('aria-pressed', 'false');
        }
    }

    /**
     * Aplica o tamanho da fonte salvo no localStorage ou o padrão.
     */
    function applySavedFontSize() {
        document.documentElement.style.fontSize = `${currentFontSize}px`;
    }

    // Aplica as configurações salvas ao carregar a página
    applySavedTheme();
    applySavedContrast();
    applySavedFontSize();

    // --- Event Listeners Globais ---

    // Link "Pular para o Conteúdo Principal"
    if (skipLink && mainContent) {
        skipLink.addEventListener('click', (e) => {
            e.preventDefault();
            mainContent.setAttribute('tabindex', '-1'); // Torna o main focável temporariamente
            mainContent.focus(); // Foca no conteúdo principal
            // Remove tabindex depois de focar para evitar problemas de tabbing persistente
            mainContent.addEventListener('blur', () => {
                mainContent.removeAttribute('tabindex');
            }, { once: true });
        });
    }

    // Menu móvel
    if (menuToggle && navLinks) {
        // Inicializa links do menu mobile como não focáveis se o menu estiver fechado
        if (navLinks.hidden) {
            navLinks.querySelectorAll('a, button').forEach(el => el.setAttribute('tabindex', '-1'));
        }

        menuToggle.addEventListener('click', () => {
            const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
            navLinks.classList.toggle('show');
            menuToggle.setAttribute('aria-expanded', !isExpanded);
            navLinks.hidden = !navLinks.hidden; // Alterna o atributo hidden

            // Gerenciamento de foco para acessibilidade do menu móvel
            const focusableElementsInNav = navLinks.querySelectorAll('a, button'); // Outros elementos focáveis dentro do nav
            if (!isExpanded) { // Menu está abrindo
                focusableElementsInNav.forEach(el => el.removeAttribute('tabindex')); // Torna-os focáveis
                if (focusableElementsInNav.length > 0) {
                    focusableElementsInNav[0].focus(); // Foca no primeiro item do menu
                }
            } else { // Menu está fechando
                focusableElementsInNav.forEach(el => el.setAttribute('tabindex', '-1')); // Torna-os não focáveis
                menuToggle.focus(); // Retorna o foco para o botão que abriu/fechou o menu
            }
        });
    }


    // Botão voltar ao topo
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            document.body.classList.add('scrolled'); // O CSS se encarrega do display
        } else {
            document.body.classList.remove('scrolled');
        }
    });

    if (btnTopo) {
        btnTopo.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth',
            });
        });
    }

    // --- Acessibilidade Menu ---
    if (acessibilidadeBtn && acessibilidadeMenu) {
        acessibilidadeBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            const isHidden = acessibilidadeMenu.hidden;

            acessibilidadeMenu.hidden = !isHidden;
            acessibilidadeMenu.classList.toggle('acessibilidade-menu-visible', !isHidden);
            acessibilidadeBtn.setAttribute('aria-expanded', !isHidden);
        });

        // Fechar menu de acessibilidade ao clicar fora
        document.addEventListener('click', (event) => {
            if (!acessibilidadeMenu.contains(event.target) && !acessibilidadeBtn.contains(event.target)) {
                acessibilidadeMenu.hidden = true;
                acessibilidadeMenu.classList.remove('acessibilidade-menu-visible');
                acessibilidadeBtn.setAttribute('aria-expanded', 'false');
            }
        });

        // Fechar menu de acessibilidade com ESC
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                acessibilidadeMenu.hidden = true;
                acessibilidadeMenu.classList.remove('acessibilidade-menu-visible');
                acessibilidadeBtn.setAttribute('aria-expanded', 'false');
            }
        });
    }


    // Aumentar fonte
    if (btnAumentarFonte) {
        btnAumentarFonte.addEventListener('click', () => {
            currentFontSize += FONT_SIZE_STEP;
            document.documentElement.style.fontSize = `${currentFontSize}px`;
            localStorage.setItem('fontSize', currentFontSize);
        });
    }


    // Diminuir fonte
    if (btnDiminuirFonte) {
        btnDiminuirFonte.addEventListener('click', () => {
            currentFontSize -= FONT_SIZE_STEP;
            if (currentFontSize < 10) currentFontSize = 10;
            document.documentElement.style.fontSize = `${currentFontSize}px`;
            localStorage.setItem('fontSize', currentFontSize);
        });
    }


    // Alternar tema claro/escuro
    if (btnToggleTema) {
        btnToggleTema.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            const isDark = document.body.classList.contains('dark-theme');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            btnToggleTema.setAttribute('aria-pressed', isDark);
        });
    }


    // Alternar alto contraste
    if (btnAltoContraste) {
        btnAltoContraste.addEventListener('click', () => {
            document.body.classList.toggle('high-contrast');
            const isHighContrast = document.body.classList.contains('high-contrast');
            localStorage.setItem('highContrast', isHighContrast);
            btnAltoContraste.setAttribute('aria-pressed', isHighContrast);
        });
    }


    // Event listeners para os botões de leitura
    if (btnLerTexto) {
        btnLerTexto.addEventListener('click', startReading);
    }
    if (btnPararLeitura) {
        btnPararLeitura.addEventListener('click', stopReading);
    }

    // O código para o botão 'explore a conexão' foi removido aqui.

    // --- Sistema de Abas de Seções ---
    document.querySelectorAll('.nav-links a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault(); // Impede o comportamento padrão do link

            const hash = this.getAttribute('href');
            const targetSectionId = hash.slice(1); // Pega o ID da seção sem o '#'
            const targetSection = document.getElementById(targetSectionId);

            // Esconde todas as seções
            const allSections = document.querySelectorAll('main > section');
            allSections.forEach(sec => {
                sec.style.display = 'none';
                sec.classList.remove('revealed'); // Garante que a animação possa ser re-executada
                sec.setAttribute('aria-hidden', 'true'); // Esconde de leitores de tela
            });

            // Mostra apenas a seção alvo (seção clicada)
            if (targetSection) {
                targetSection.style.display = ''; // Volta para o display padrão (normalmente 'block' ou 'flex')
                // Força o reflow para garantir a animação data-reveal
                void targetSection.offsetWidth;
                targetSection.classList.add('revealed'); // Adiciona a classe para animar
                targetSection.removeAttribute('aria-hidden'); // Mostra para leitores de tela
                targetSection.focus(); // Foca na seção para acessibilidade

                // Se a seção de impacto for mostrada, renderiza o gráfico
                if (targetSection.id === 'impacto' && !chartRendered) {
                    renderImpactChart();
                    chartRendered = true;
                }
            }

            // Destaca a aba ativa no menu
            document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
            this.classList.add('active');

            // Fecha o menu mobile (se aberto)
            if (navLinks && navLinks.classList.contains('show')) {
                navLinks.classList.remove('show');
                menuToggle.setAttribute('aria-expanded', 'false');
                navLinks.hidden = true;
                // Gerenciamento de foco ao fechar menu após clique em link
                navLinks.querySelectorAll('a, button').forEach(el => el.setAttribute('tabindex', '-1'));
                menuToggle.focus(); // Retorna o foco para o menu toggle
            }

            // Rola suavemente para o topo da seção
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start' // Garante que o topo da seção fique visível
                });
            }
        });
    });

    // Função para inicializar o sistema de abas ao carregar a página
    function initializeTabSystem() {
        const allSections = document.querySelectorAll('main > section');
        const firstSection = document.getElementById('introducao'); // Seção inicial a ser mostrada

        // Esconde todas as seções e remove a classe 'revealed'
        allSections.forEach(sec => {
            sec.style.display = 'none';
            sec.classList.remove('revealed');
            sec.setAttribute('aria-hidden', 'true');
        });

        // Mostra a primeira seção (hero) por padrão e aplica a animação
        if (firstSection) {
            firstSection.style.display = '';
            firstSection.classList.add('revealed');
            firstSection.removeAttribute('aria-hidden');
        }

        // Destaca o primeiro link do menu
        const firstLink = document.querySelector('.nav-links a[href="#introducao"]'); // Link para a seção de introdução
        if (firstLink) {
            document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
            firstLink.classList.add('active');
        }
    }

    // Chama a inicialização do sistema de abas ao carregar a página
    initializeTabSystem();


    // --- Carrossel ---
    const carouselTrack = document.querySelector('.carousel-track');
    const carouselSlides = Array.from(document.querySelectorAll('.carousel-slide'));
    const prevBtn = document.querySelector('.carousel-btn.prev');
    const nextBtn = document.querySelector('.carousel-btn.next');
    const carouselElement = document.querySelector('.carousel');

    let currentSlideIndex = 0;
    let autoPlayInterval;
    const AUTO_PLAY_DELAY = 5000; // 5 segundos

    if (carouselElement && carouselSlides.length > 0) { // Garante que o carrossel e slides existam
        // Adiciona loading="lazy" a todas as imagens do carrossel para performance
        carouselSlides.forEach(slide => {
            const img = slide.querySelector('img');
            if (img) {
                img.setAttribute('loading', 'lazy');
            }
        });

        // Cria os indicadores de slide (dots)
        const carouselDotsContainer = document.createElement('div');
        carouselDotsContainer.classList.add('carousel-dots');
        carouselSlides.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.classList.add('carousel-dot');
            dot.setAttribute('aria-label', `Ir para o slide ${index + 1}`);
            dot.setAttribute('role', 'tab'); // Para acessibilidade
            dot.setAttribute('aria-controls', `carousel-slide-${index}`); // Para acessibilidade
            dot.id = `carousel-dot-${index}`; // Para acessibilidade
            if (index === 0) {
                dot.classList.add('active');
                dot.setAttribute('aria-selected', 'true'); // Para acessibilidade
            } else {
                dot.setAttribute('aria-selected', 'false'); // Para acessibilidade
            }
            dot.addEventListener('click', () => {
                resetAutoPlay(); // Reseta o auto-play ao clicar no dot
                moveToSlide(index);
            });
            carouselDotsContainer.appendChild(dot);
        });
        carouselElement.appendChild(carouselDotsContainer);
        // Adiciona role="tablist" e aria-live para o carrossel
        carouselElement.setAttribute('role', 'region');
        carouselElement.setAttribute('aria-label', 'Carrossel de imagens sobre a conexão campo-cidade');
        carouselElement.setAttribute('aria-live', 'polite'); // Anuncia mudanças para leitores de tela

        const carouselDots = Array.from(document.querySelectorAll('.carousel-dot'));

        /**
         * Move o carrossel para um slide específico.
         * @param {number} targetIndex O índice do slide de destino.
         */
        function moveToSlide(targetIndex) {
            if (targetIndex < 0) {
                targetIndex = carouselSlides.length - 1;
            } else if (targetIndex >= carouselSlides.length) {
                targetIndex = 0;
            }

            const offset = carouselSlides[targetIndex].offsetLeft;
            carouselTrack.style.transform = `translateX(-${offset}px)`;
            currentSlideIndex = targetIndex;

            // Atualiza a classe 'active' e atributos ARIA nos dots
            carouselDots.forEach((dot, index) => {
                const isActive = (index === currentSlideIndex);
                dot.classList.toggle('active', isActive);
                dot.setAttribute('aria-selected', isActive);
                dot.setAttribute('tabindex', isActive ? '0' : '-1'); // Torna o dot ativo focável
            });

            // Atualiza aria-hidden para acessibilidade nos slides
            carouselSlides.forEach((slide, index) => {
                const isCurrent = (index === currentSlideIndex);
                slide.setAttribute('aria-hidden', !isCurrent);
                slide.setAttribute('id', `carousel-slide-${index}`); // Adiciona ID para aria-controls
                slide.setAttribute('role', 'tabpanel'); // Para acessibilidade
                slide.setAttribute('aria-labelledby', `carousel-dot-${index}`); // Associa ao dot

                // Garante que apenas o slide ativo seja focável para leitores de tela
                const focusableElementsInSlide = slide.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
                focusableElementsInSlide.forEach(el => {
                    if (isCurrent) {
                        el.removeAttribute('tabindex');
                    } else {
                        el.setAttribute('tabindex', '-1');
                    }
                });
            });
        }

        /**
         * Inicia o auto-play do carrossel.
         */
        function startAutoPlay() {
            stopAutoPlay(); // Garante que não há múltiplos intervalos
            autoPlayInterval = setInterval(() => {
                moveToSlide(currentSlideIndex + 1);
            }, AUTO_PLAY_DELAY);
        }

        /**
         * Para o auto-play do carrossel.
         */
        function stopAutoPlay() {
            clearInterval(autoPlayInterval);
        }

        /**
         * Reseta o auto-play (para e reinicia).
         */
        function resetAutoPlay() {
            stopAutoPlay();
            startAutoPlay();
        }

        // Navegação do carrossel
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                resetAutoPlay(); // Reseta o auto-play ao clicar
                moveToSlide(currentSlideIndex - 1);
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                resetAutoPlay(); // Reseta o auto-play ao clicar
                moveToSlide(currentSlideIndex + 1);
            });
        }

        // Pausa o auto-play ao passar o mouse ou focar no carrossel
        carouselElement.addEventListener('mouseenter', stopAutoPlay);
        carouselElement.addEventListener('mouseleave', startAutoPlay);
        carouselElement.addEventListener('focusin', stopAutoPlay); // Pausa ao focar em qualquer elemento dentro
        carouselElement.addEventListener('focusout', startAutoPlay); // Reinicia ao sair o foco

        // Inicializa o carrossel
        moveToSlide(0);
        startAutoPlay(); // Inicia o auto-play
    }


    // --- Quiz Interativo ---
    if (quizForm) {
        const correctAnswers = {
            q1: 'b', // Produzir alimentos e matérias-primas
            q2: 'b', // Preservação de recursos naturais
            q3: 'a', // Infraestrutura precária em áreas rurais
            q4: 'b', // Oferecendo tecnologia, mercados e serviços
            q5: 'b'  // Apoiar o comércio justo e a produção local
        };

        /**
         * Resets the quiz to its initial state.
         */
        function resetQuiz() {
            quizForm.reset();
            quizResult.innerHTML = '';
            quizResult.hidden = true;
            quizResult.classList.remove('quiz-result-success', 'quiz-result-fail');

            const fieldsets = quizForm.querySelectorAll('fieldset');
            fieldsets.forEach(fieldset => {
                fieldset.classList.remove('correct', 'incorrect');
                const legend = fieldset.querySelector('legend');
                const feedbackSpan = legend.querySelector('span');
                if (feedbackSpan) {
                    feedbackSpan.remove();
                }
                const explanationDiv = fieldset.querySelector('.question-explanation');
                if (explanationDiv) {
                    explanationDiv.remove();
                }
                // Remove aria-invalid e aria-describedby de todos os inputs do quiz
                fieldset.querySelectorAll('input[type="radio"]').forEach(radio => {
                    radio.removeAttribute('aria-invalid');
                    radio.removeAttribute('aria-describedby');
                });
                // Remove mensagens de erro inline
                const errorSpan = fieldset.querySelector('.error-message');
                if (errorSpan) {
                    errorSpan.remove();
                }
            });
            quizForm.querySelector('button[type="submit"]').disabled = false;
            const currentBtnReiniciarQuiz = document.getElementById('btn-reiniciar-quiz');
            if (currentBtnReiniciarQuiz) {
                currentBtnReiniciarQuiz.hidden = true;
            }
        }

        quizForm.addEventListener('submit', (event) => {
            event.preventDefault();

            let score = 0;
            const formData = new FormData(quizForm);
            let allAnswered = true;

            quizResult.innerHTML = '';
            quizResult.hidden = true;
            quizResult.classList.remove('quiz-result-success', 'quiz-result-fail');

            // Limpa mensagens de erro inline anteriores para o quiz
            const prevErrorSpans = quizForm.querySelectorAll('.error-message');
            prevErrorSpans.forEach(span => span.remove());

            for (const [question, correctAnswer] of Object.entries(correctAnswers)) {
                const userAnswer = formData.get(question);
                // Usando :has para selecionar o fieldset que contém o input de rádio
                const fieldset = quizForm.querySelector(`fieldset:has([name="${question}"])`);
                const legend = fieldset.querySelector('legend');
                const radioInputs = fieldset.querySelectorAll(`input[name="${question}"]`);

                fieldset.classList.remove('correct', 'incorrect');
                const oldFeedbackSpan = legend.querySelector('span');
                if (oldFeedbackSpan) {
                    oldFeedbackSpan.remove();
                }

                const explanationDiv = fieldset.querySelector('.question-explanation');
                if (explanationDiv) {
                    explanationDiv.remove();
                }

                // Limpa aria-invalid e aria-describedby para cada grupo de rádio
                radioInputs.forEach(radio => {
                    radio.removeAttribute('aria-invalid');
                    radio.removeAttribute('aria-describedby');
                });

                let feedbackText = '';
                let explanation = '';
                let errorId = `error-${question}`; // ID para a mensagem de erro

                if (!userAnswer) {
                    allAnswered = false;
                    fieldset.classList.add('incorrect');
                    feedbackText = '(Por favor, responda!)';
                    explanation = 'Você precisa selecionar uma opção para esta pergunta.';
                    // Adiciona aria-invalid e aria-describedby ao primeiro rádio do grupo
                    if (radioInputs.length > 0) {
                        radioInputs[0].setAttribute('aria-invalid', 'true');
                        radioInputs[0].setAttribute('aria-describedby', errorId);
                    }
                    showInlineError(legend, 'Por favor, selecione uma opção.', errorId); // Exibe erro inline
                } else if (userAnswer === correctAnswer) {
                    score++;
                    fieldset.classList.add('correct');
                    feedbackText = '(Correto!)';
                    switch (question) {
                        case 'q1': explanation = 'O campo é a principal fonte de alimentos e matérias-primas essenciais para a vida nas cidades.'; break;
                        case 'q2': explanation = 'A preservação de recursos naturais e a biodiversidade são funções vitais do campo para a sustentabilidade do planeta.'; break;
                        case 'q3': explanation = 'A infraestrutura precária, como estradas e acesso à internet, é um dos maiores desafios para a conexão eficiente entre campo e cidade.'; break;
                        case 'q4': explanation = 'As cidades impulsionam o campo ao oferecerem novas tecnologias, acesso a mercados consumidores e diversos serviços essenciais.'; break;
                        case 'q5': explanation = 'Apoiar o comércio justo e a produção local fortalece o campo, garantindo que os agricultores recebam um preço justo e incentivando práticas sustentáveis.'; break;
                    }
                } else {
                    fieldset.classList.add('incorrect');
                    feedbackText = '(Incorreto!)';
                    switch (question) {
                        case 'q1': explanation = `A resposta correta é "Produzir alimentos e matérias-primas". O campo é fundamental para o abastecimento das cidades.`; break;
                        case 'q2': explanation = `A resposta correta é "Preservação de recursos naturais". O campo desempenha um papel crucial na conservação ambiental.`; break;
                        case 'q3': explanation = `A resposta correta é "Infraestrutura precária em áreas rurais". Melhorar a infraestrutura é chave para fortalecer a conexão.`; break;
                        case 'q4': explanation = `A resposta correta é "Oferecendo tecnologia, mercados e serviços". As cidades são centros de inovação e consumo para o campo.`; break;
                        case 'q5': explanation = `A resposta correta é "Apoiar o comércio justo e a produção local". Isso valoriza o trabalho do agricultor e promove a sustentabilidade.`; break;
                    }
                }

                const newFeedbackSpan = document.createElement('span');
                newFeedbackSpan.style.fontWeight = 'normal';
                newFeedbackSpan.style.marginLeft = '10px';
                newFeedbackSpan.style.color = (userAnswer === correctAnswer) ? 'green' : 'red';
                newFeedbackSpan.textContent = feedbackText;
                legend.appendChild(newFeedbackSpan);

                const newExplanationDiv = document.createElement('div');
                newExplanationDiv.classList.add('question-explanation');
                newExplanationDiv.style.fontSize = '0.9em';
                newExplanationDiv.style.color = '#555';
                newExplanationDiv.style.marginTop = '5px';
                newExplanationDiv.textContent = explanation;
                fieldset.appendChild(newExplanationDiv);
            }

            if (!allAnswered) {
                // Exibe um modal de erro se nem todas as perguntas foram respondidas
                displayModal('Por favor, responda a todas as perguntas antes de enviar o quiz.', 'error');
                return;
            }

            let message = `Você acertou ${score} de ${Object.keys(correctAnswers).length} perguntas!`;
            if (score === Object.keys(correctAnswers).length) {
                message += ' Parabéns, você é um expert na conexão campo-cidade!';
                quizResult.classList.add('quiz-result-success');
            } else if (score >= Object.keys(correctAnswers).length / 2) {
                message += ' Muito bom! Continue aprendendo sobre essa importante conexão.';
                quizResult.classList.add('quiz-result-success');
            } else {
                message += ' Não desanime! Revise o conteúdo e tente novamente para fortalecer seus conhecimentos.';
                quizResult.classList.add('quiz-result-fail');
            }
            quizResult.innerHTML = message;
            quizResult.hidden = false;
            quizResult.focus(); // Foca no resultado para leitores de tela

            quizForm.querySelector('button[type="submit"]').disabled = true;

            let restartButton = document.getElementById('btn-reiniciar-quiz');
            if (!restartButton) {
                restartButton = document.createElement('button');
                restartButton.id = 'btn-reiniciar-quiz';
                restartButton.textContent = 'Reiniciar Quiz';
                restartButton.classList.add('btn-cta');
                restartButton.setAttribute('aria-label', 'Reiniciar o quiz para tentar novamente');
                restartButton.setAttribute('type', 'button');
                quizForm.appendChild(restartButton);
                restartButton.addEventListener('click', resetQuiz);
            } else {
                restartButton.hidden = false;
            }
        });

        const initialBtnReiniciarQuiz = document.getElementById('btn-reiniciar-quiz');
        if (initialBtnReiniciarQuiz) {
            initialBtnReiniciarQuiz.addEventListener('click', resetQuiz);
        }
    }

    // --- Formulário de Contato ---
    if (contactForm) {
        // Adiciona o botão de copiar e-mail
        const emailLink = document.querySelector('#contato a[href^="mailto:"]');
        if (emailLink) {
            const emailAddress = emailLink.textContent;
            const copyEmailButton = document.createElement('button');
            copyEmailButton.classList.add('btn-copy-email');
            copyEmailButton.innerHTML = '<i class="fas fa-copy"></i> Copiar E-mail';
            copyEmailButton.setAttribute('aria-label', `Copiar endereço de e-mail ${emailAddress}`);
            copyEmailButton.setAttribute('type', 'button'); // Importante para não submeter o formulário

            // Insere o botão após o link do e-mail
            emailLink.parentNode.insertBefore(copyEmailButton, emailLink.nextSibling);

            copyEmailButton.addEventListener('click', () => {
                // Usa document.execCommand para compatibilidade em iframes
                const tempInput = document.createElement('input');
                tempInput.value = emailAddress;
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand('copy');
                document.body.removeChild(tempInput);

                displayModal('E-mail copiado para a área de transferência!', 'info', 3000); // Fecha automaticamente após 3 segundos
            });
        }

        /**
         * Define o estado de carregamento para o envio do formulário.
         * @param {boolean} isLoading True para mostrar carregamento, false para esconder.
         */
        function setLoadingState(isLoading) {
            const submitButton = contactForm.querySelector('button[type="submit"]');
            if (isLoading) {
                loadingSpinner.style.display = 'flex';
                if (submitButton) {
                    submitButton.disabled = true;
                    submitButton.style.opacity = '0.7';
                    submitButton.style.cursor = 'not-allowed';
                }
            } else {
                loadingSpinner.style.display = 'none';
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.style.opacity = '1';
                    submitButton.style.cursor = 'pointer';
                }
            }
        }

        contactForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            // Limpa mensagens de erro inline anteriores
            const errorSpans = contactForm.querySelectorAll('.error-message');
            errorSpans.forEach(span => span.remove());

            // Remove aria-invalid e a classe is-invalid de todos os campos
            contactForm.querySelectorAll('input, textarea').forEach(field => {
                field.removeAttribute('aria-invalid');
                field.removeAttribute('aria-describedby');
                field.classList.remove('is-invalid'); // Remove classe de erro visual
            });

            setLoadingState(true); // Mostra spinner e desabilita botão

            // Validação aprimorada do formulário
            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            const messageInput = document.getElementById('message');

            let isValid = true;

            // Validação do Nome
            if (nameInput.value.trim() === '') {
                isValid = false;
                showInlineError(nameInput, 'Por favor, insira seu nome.', 'name-error');
            }

            // Validação do E-mail
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (emailInput.value.trim() === '') {
                isValid = false;
                showInlineError(emailInput, 'Por favor, insira seu e-mail.', 'email-error');
            } else if (!emailPattern.test(emailInput.value.trim())) {
                isValid = false;
                showInlineError(emailInput, 'Por favor, insira um e-mail válido.', 'email-error');
            }

            // Validação da Mensagem
            if (messageInput.value.trim().length < 10) {
                isValid = false;
                showInlineError(messageInput, 'Sua mensagem deve ter pelo menos 10 caracteres.', 'message-error');
            }

            if (!isValid) {
                setLoadingState(false); // Esconde spinner e reabilita botão
                // Foca no primeiro campo inválido
                const firstInvalidField = contactForm.querySelector('.is-invalid');
                if (firstInvalidField) {
                    firstInvalidField.focus();
                }
                displayModal('Por favor, corrija os erros no formulário.', 'error');
                return;
            }

            // Se a validação passou, procede com a simulação de envio
            try {
                // IMPORTANTE: Em um ambiente de produção, substitua esta linha por uma chamada real para o seu backend (ex: fetch('/api/send-email', { method: 'POST', body: formData }))
                await new Promise(resolve => setTimeout(resolve, 1500)); // Simula atraso

                displayModal('Mensagem enviada com sucesso! Agradecemos seu contato.', 'success', 3000); // Fecha automaticamente após 3 segundos
                contactForm.reset(); // Limpa o formulário apenas em caso de sucesso
            } catch (error) {
                console.error('Erro ao enviar formulário:', error);
                displayModal('Ocorreu um erro ao enviar sua mensagem. Por favor, tente novamente mais tarde.', 'error');
            } finally {
                setLoadingState(false); // Esconde spinner e reabilita botão (sempre, no final da operação)
            }
        });
    }

    // --- Animações de Revelação (data-reveal) ---
    // Este observer é agora principalmente para o efeito 'revealed' e para renderizar o gráfico na seção 'impacto'
    const revealElements = document.querySelectorAll('[data-reveal]');
    let chartRendered = false; // Flag para garantir que o gráfico seja renderizado apenas uma vez

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');

                // Renderiza o gráfico apenas quando a seção 'impacto' é revelada e ainda não foi renderizado
                if (entry.target.id === 'impacto' && !chartRendered) {
                    renderImpactChart();
                    chartRendered = true; // Define a flag para true
                }
                // Continua observando para que a animação possa ser re-executada se a seção for escondida/mostrada
                // observer.unobserve(entry.target); // Não desobservar se quiser re-animar ou re-renderizar o gráfico
            } else {
                // Remove a classe 'revealed' quando a seção não está mais visível,
                // permitindo que a animação seja acionada novamente se a seção reaparecer
                entry.target.classList.remove('revealed');
                // Reset chartRendered if 'impacto' section is no longer visible
                if (entry.target.id === 'impacto') {
                    chartRendered = false; // Permite re-renderizar o gráfico se a seção for novamente visível
                }
            }
        });
    }, observerOptions);

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });

    // --- Gráfico da Seção Impacto (Chart.js) ---
    let impactChartInstance = null; // Para armazenar a instância do gráfico e destruí-la se necessário

    /**
     * Renderiza o gráfico de impacto na seção correspondente.
     */
    function renderImpactChart() {
        const ctx = document.getElementById('impactChart');

        if (ctx && typeof Chart !== 'undefined') {
            // Destrói a instância anterior do gráfico se existir
            if (impactChartInstance) {
                impactChartInstance.destroy();
            }

            impactChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Alimentos', 'Tecnologia', 'Recursos Naturais', 'Cultura', 'Empregos'],
                    datasets: [{
                        label: 'Fluxo Campo-Cidade (Importância Relativa)',
                        data: [80, 65, 75, 50, 70],
                        backgroundColor: [
                            'rgba(44, 122, 44, 0.8)', // Verde escuro
                            'rgba(70, 130, 180, 0.8)', // Azul aço
                            'rgba(255, 165, 0, 0.8)', // Laranja
                            'rgba(138, 43, 226, 0.8)', // Azul violeta
                            'rgba(255, 215, 0, 0.8)' // Ouro
                        ],
                        borderColor: [
                            'rgba(44, 122, 44, 1)',
                            'rgba(70, 130, 180, 1)',
                            'rgba(255, 165, 0, 1)',
                            'rgba(138, 43, 226, 1)',
                            'rgba(255, 215, 0, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false, // Permite que o gráfico não mantenha a proporção original
                    plugins: {
                        title: {
                            display: true,
                            text: 'Intercâmbio Essencial: Campo e Cidade',
                            font: {
                                size: 18,
                                family: 'Playfair Display'
                            },
                            color: '#2c7a2c' // Cor do título do gráfico
                        },
                        legend: {
                            display: false // Não exibir a legenda do dataset
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Nível de Importância',
                                font: {
                                    size: 14
                                },
                                color: '#333' // Cor do texto do eixo Y
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Áreas de Conexão',
                                font: {
                                    size: 14
                                },
                                color: '#333' // Cor do texto do eixo X
                            }
                        }
                    }
                }
            });
        } else {
            console.warn('Canvas para o gráfico não encontrado ou Chart.js não carregado.');
        }
    }

    // --- Ano Dinâmico no Rodapé ---
    const currentYearElement = document.querySelector('footer p');
    if (currentYearElement) {
        currentYearElement.textContent = currentYearElement.textContent.replace('2025', new Date().getFullYear());
    }

    // --- Conteúdo Expansível ("Leia Mais") ---
    const collapsibleSections = document.querySelectorAll('.content-section');

    collapsibleSections.forEach(section => {
        // Encontra o primeiro parágrafo dentro da seção que não é um placeholder de gráfico
        const mainContentElement = section.querySelector('p:not(.placeholder-text)');
        if (!mainContentElement) return; // Se não houver parágrafo, não faz nada

        const originalText = mainContentElement.textContent;
        const words = originalText.split(' ');
        const maxWords = 50; // Limite de palavras para exibir inicialmente

        if (words.length > maxWords) {
            const visibleText = words.slice(0, maxWords).join(' ') + '...';
            const hiddenText = words.slice(maxWords).join(' ');

            const hiddenContentSpan = document.createElement('span');
            hiddenContentSpan.classList.add('hidden-content');
            hiddenContentSpan.textContent = hiddenText;

            const readMoreButton = document.createElement('button');
            readMoreButton.classList.add('btn-read-more');
            readMoreButton.textContent = 'Leia Mais';
            readMoreButton.setAttribute('aria-expanded', 'false');
            // Usar um ID único para cada conteúdo expansível para aria-controls
            const contentId = `content-expand-${section.id || Math.random().toString(36).substr(2, 9)}`;
            hiddenContentSpan.id = contentId;
            readMoreButton.setAttribute('aria-controls', contentId);

            readMoreButton.addEventListener('click', () => {
                const isExpanded = readMoreButton.getAttribute('aria-expanded') === 'true';
                hiddenContentSpan.classList.toggle('visible', !isExpanded);s
                readMoreButton.setAttribute('aria-expanded', !isExpanded);

                if (!isExpanded) {
                    // Rola suavemente para o início do parágrafo quando expande
                    mainContentElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        }
    });

});
