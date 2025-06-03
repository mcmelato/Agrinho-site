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

    // Menu móvel
    menuToggle.addEventListener('click', () => {
        const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
        navLinks.classList.toggle('show');
        menuToggle.setAttribute('aria-expanded', !isExpanded);
        navLinks.hidden = !navLinks.hidden; // Alterna o atributo hidden
    });

    // Botão voltar ao topo
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            btnTopo.style.display = 'flex'; // Usar flex para centralizar o ícone
            btnTopo.style.opacity = '1';
        } else {
            btnTopo.style.opacity = '0';
            setTimeout(() => {
                btnTopo.style.display = 'none';
            }, 300);
        }
    });

    btnTopo.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    });

    // --- Acessibilidade Menu ---
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

    // Aumentar fonte
    btnAumentarFonte.addEventListener('click', () => {
        currentFontSize += FONT_SIZE_STEP;
        document.documentElement.style.fontSize = `${currentFontSize}px`;
        localStorage.setItem('fontSize', currentFontSize);
    });

    // Diminuir fonte
    btnDiminuirFonte.addEventListener('click', () => {
        currentFontSize -= FONT_SIZE_STEP;
        if (currentFontSize < 10) currentFontSize = 10;
        document.documentElement.style.fontSize = `${currentFontSize}px`;
        localStorage.setItem('fontSize', currentFontSize);
    });

    // Alternar tema claro/escuro
    btnToggleTema.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        btnToggleTema.setAttribute('aria-pressed', isDark);
    });

    // Alternar alto contraste
    btnAltoContraste.addEventListener('click', () => {
        document.body.classList.toggle('high-contrast');
        const isHighContrast = document.body.classList.contains('high-contrast');
        localStorage.setItem('highContrast', isHighContrast);
        btnAltoContraste.setAttribute('aria-pressed', isHighContrast);
    });

    // Event listeners para os botões de leitura
    if (btnLerTexto) {
        btnLerTexto.addEventListener('click', startReading);
    }
    if (btnPararLeitura) {
        btnPararLeitura.addEventListener('click', stopReading);
    }

    // --- Rolagem Suave para Links de Navegação ---
    document.querySelectorAll('.nav-links a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
                // Fechar menu móvel após clicar em um link
                if (navLinks.classList.contains('show')) {
                    navLinks.classList.remove('show');
                    menuToggle.setAttribute('aria-expanded', 'false');
                    navLinks.hidden = true;
                }
            }
        });
    });

    // --- Destaque do Link de Navegação Ativo ---
    const sections = document.querySelectorAll('main section[id]');
    const navLinksList = document.querySelectorAll('.nav-links a');

    const observerConfig = {
        root: null,
        rootMargin: '0px',
        threshold: 0.3
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const currentSectionId = entry.target.id;
                navLinksList.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${currentSectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, observerConfig);

    sections.forEach(section => {
        sectionObserver.observe(section);
    });


    // --- Carrossel ---
    const carouselTrack = document.querySelector('.carousel-track');
    const carouselSlides = Array.from(document.querySelectorAll('.carousel-slide'));
    const prevBtn = document.querySelector('.carousel-btn.prev');
    const nextBtn = document.querySelector('.carousel-btn.next');
    const carouselElement = document.querySelector('.carousel');

    let currentSlideIndex = 0;
    let autoPlayInterval;
    const AUTO_PLAY_DELAY = 5000; // 5 segundos

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
    if (carouselElement) {
        carouselElement.appendChild(carouselDotsContainer);
        // Adiciona role="tablist" e aria-live para o carrossel
        carouselElement.setAttribute('role', 'region');
        carouselElement.setAttribute('aria-label', 'Carrossel de imagens sobre a conexão campo-cidade');
        carouselElement.setAttribute('aria-live', 'polite'); // Anuncia mudanças para leitores de tela
    }
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
    if (carouselElement) {
        carouselElement.addEventListener('mouseenter', stopAutoPlay);
        carouselElement.addEventListener('mouseleave', startAutoPlay);
        carouselElement.addEventListener('focusin', stopAutoPlay); // Pausa ao focar em qualquer elemento dentro
        carouselElement.addEventListener('focusout', startAutoPlay); // Reinicia ao sair o foco
    }


    // Inicializa o carrossel
    if (carouselSlides.length > 0) {
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
                showInlineError(nameInput, 'Por favor, insira seu nome.');
            }

            // Validação do E-mail
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (emailInput.value.trim() === '') {
                isValid = false;
                showInlineError(emailInput, 'Por favor, insira seu e-mail.');
            } else if (!emailPattern.test(emailInput.value.trim())) {
                isValid = false;
                showInlineError(emailInput, 'Por favor, insira um e-mail válido.');
            }

            // Validação da Mensagem
            if (messageInput.value.trim().length < 10) {
                isValid = false;
                showInlineError(messageInput, 'Sua mensagem deve ter pelo menos 10 caracteres.');
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

        /**
         * Exibe uma mensagem de erro abaixo do campo do formulário.
         * @param {HTMLElement} element O elemento de input/textarea ou legend para grupos de rádio.
         * @param {string} message A mensagem de erro a ser exibida.
         * @param {string} [errorId] Opcional. ID para a mensagem de erro (usado para quiz).
         */
        function showInlineError(element, message, errorId = `${element.id}-error`) {
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
    }

    // --- Animações de Revelação (data-reveal) ---
    const revealElements = document.querySelectorAll('[data-reveal]');
    let chartRendered = false;

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');

                if (entry.target.id === 'impacto' && !chartRendered) {
                    renderImpactChart();
                    chartRendered = true;
                }
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });

    // --- Gráfico da Seção Impacto (Chart.js) ---
    let impactChartInstance = null;

    /**
     * Renderiza o gráfico de impacto na seção correspondente.
     */
    function renderImpactChart() {
        const ctx = document.getElementById('impactChart');

        if (ctx && typeof Chart !== 'undefined') {
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
                            'rgba(44, 122, 44, 0.8)',
                            'rgba(70, 130, 180, 0.8)',
                            'rgba(255, 165, 0, 0.8)',
                            'rgba(138, 43, 226, 0.8)',
                            'rgba(255, 215, 0, 0.8)'
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
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Intercâmbio Essencial: Campo e Cidade',
                            font: {
                                size: 18,
                                family: 'Playfair Display'
                            },
                            color: '#2c7a2c'
                        },
                        legend: {
                            display: false
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
                                color: '#333'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Áreas de Conexão',
                                font: {
                                    size: 14
                                },
                                color: '#333'
                            }
                        }
                    }
                }
            });
        } else {
            console.warn('Canvas para o gráfico não encontrado ou Chart.js não carregado.');
        }
    }

    // --- Função para exibir modal customizado (substituindo alerts) ---
    /**
     * Exibe um modal customizado com uma mensagem e um tipo (sucesso, erro, info).
     * @param {string} message A mensagem a ser exibida no modal.
     * @param {string} type O tipo de mensagem ('success', 'error', 'info').
     * @param {number} [autoCloseDelay=0] Opcional. Atraso em milissegundos para fechar o modal automaticamente. 0 para não fechar automaticamente.
     */
    function displayModal(message, type = 'info', autoCloseDelay = 0) {
        let modal = document.getElementById('custom-modal');
        let modalMessage = document.getElementById('modal-message');
        let modalIcon = modal.querySelector('.modal-icon');
        let closeButton = modal.querySelector('button');

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
        if (!mainContentElement) return;

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
            readMoreButton.setAttribute('aria-controls', `content-${section.id}`); // Associa ao conteúdo expandível

            mainContentElement.textContent = visibleText;
            mainContentElement.appendChild(hiddenContentSpan);
            mainContentElement.parentNode.insertBefore(readMoreButton, mainContentElement.nextSibling);

            // Adiciona um ID ao conteúdo que será expandido/contraído para aria-controls
            mainContentElement.id = `content-${section.id}`;


            readMoreButton.addEventListener('click', () => {
                const isExpanded = readMoreButton.getAttribute('aria-expanded') === 'true';
                hiddenContentSpan.classList.toggle('visible', !isExpanded);
                readMoreButton.textContent = isExpanded ? 'Leia Mais' : 'Mostrar Menos';
                readMoreButton.setAttribute('aria-expanded', !isExpanded);

                if (!isExpanded) {
                    // Rola suavemente para o início da seção quando expande
                    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        }
    });

});
