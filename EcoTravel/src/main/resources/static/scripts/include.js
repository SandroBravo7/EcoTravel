// =================================================================
// 📚 SCRIPTS GLOBALES (include.js)
// Este archivo maneja funcionalidades comunes a todas o varias páginas,
// como modales, carga de cabecera/pie, y lógica específica de Vuelos y Paquetes.
// La lógica del MAPA ha sido movida a 'mapa.js'.
// =================================================================


// -----------------------------------------------------
// FUNCIÓN 1: LÓGICA DE MODALES (LOGIN/REGISTRO Y CIERRE GENERAL)
// -----------------------------------------------------
function initializeModalFunctionality() {
    const loginModal = document.getElementById('login-modal');
    const registerModal = document.getElementById('register-modal');

    // 🛑 NUEVA REFERENCIA: El campo oculto de redirección
    const loginRedirectUrlInput = document.getElementById('login-redirect-url');

    // (Resto de tus constantes: openLoginBtn, openRegisterBtn, closeButtons, etc.)
    const openLoginBtn = document.querySelector('.btn-login');
    const openRegisterBtn = document.querySelector('.btn-register');

    // Clase para cerrar cualquier modal con un clic
    const closeButtons = document.querySelectorAll('.close-modal');

    // Enlaces para alternar entre modales de Login y Registro
    const openRegisterLink = document.getElementById('open-register-from-login');
    const openLoginLink = document.getElementById('open-login-from-register');

    // 🛑 FUNCIÓN MODIFICADA: Ahora guarda la URL antes de abrir
    const openModal = (modal) => {
        if (modal) {
            // Lógica solo para el modal de Login
            if (modal.id === 'login-modal' && loginRedirectUrlInput) {
                // Captura la URL actual (ej. /paquetes)
                const currentPath = window.location.pathname;
                loginRedirectUrlInput.value = currentPath;
                console.log(`URL de redirección fijada a: ${currentPath}`);
            }
            modal.style.display = 'flex';
        }
    };

    const closeModal = (modal) => {
        if (modal) modal.style.display = 'none';
    };

    // Eventos de apertura desde el Header (USAN la función openModal modificada)
    if (openLoginBtn) openLoginBtn.addEventListener('click', () => openModal(loginModal));
    if (openRegisterBtn) openRegisterBtn.addEventListener('click', () => openModal(registerModal));

    // Eventos de cierre (Cierra todos los modales conocidos para seguridad)
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal(loginModal);
            closeModal(registerModal);
            closeModal(document.getElementById('reservation-modal'));
            closeModal(document.getElementById('details-lima'));
            closeModal(document.getElementById('details-arequipa'));
            closeModal(document.getElementById('details-cusco'));
        });
    });

    // Eventos para alternar entre modales
        if (openRegisterLink) {
            openRegisterLink.addEventListener('click', (e) => {
                e.preventDefault();
                closeModal(loginModal);
                openModal(registerModal); // openModal no afecta a registerModal, pero lo mantiene limpio.
            });
        }

        if (openLoginLink) {
            openLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                closeModal(registerModal);
                openModal(loginModal); // 🛑 LLAMA a openModal, que ahora guarda la URL
            });
        }

    // Devuelve las funciones para la lógica de paquetes (reservas)
    return { openModal, closeModal };
}

// -----------------------------------------------------
// FUNCIÓN 2: LÓGICA DE PUNTOS DE IMAGEN (DOTS) EN TARJETAS
// -----------------------------------------------------
function initializeCardDots() {
    console.log("Inicializando lógica de dots y tarjetas...");

    document.querySelectorAll('.destination-card').forEach(card => {
        const dots = card.querySelectorAll('.preview-dot');
        const mainImage = card.querySelector('.card-image');

        dots.forEach(dot => {
            // Activa el primer dot por defecto
            if (dot === card.querySelector('.preview-dot:first-child')) {
               dot.classList.add('active');
            }

            const changeImageAndActiveDot = () => {
                dots.forEach(d => d.classList.remove('active'));
                dot.classList.add('active');

                const newImageSrc = dot.getAttribute('data-image') || dot.getAttribute('data-preview-src');

                if (mainImage && newImageSrc) {
                    mainImage.src = newImageSrc;
                }
            };

            // Eventos de hover y click para cambiar la imagen
            dot.addEventListener('mouseover', changeImageAndActiveDot);
            dot.addEventListener('click', changeImageAndActiveDot);
        });
    });
}

// -----------------------------------------------------
// FUNCIÓN 3: LÓGICA DE MOSTRAR/OCULTAR CONTRASEÑA (TOGGLE)
// -----------------------------------------------------
function initializePasswordToggle() {
    const toggleButtons = document.querySelectorAll('.toggle-password');

    toggleButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const targetId = e.target.getAttribute('data-target');
            const passwordInput = document.getElementById(targetId);

            if (passwordInput) {
                // Cambia el tipo de input entre 'password' y 'text'
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);

                // Alterna los íconos (ojo abierto/cerrado)
                e.target.classList.toggle('fa-eye');
                e.target.classList.toggle('fa-eye-slash');
            }
        });
    });
}

// -----------------------------------------------------
// FUNCIÓN 4: LÓGICA DE IDA/VUELTA (Específica para index.html/Vuelos)
// -----------------------------------------------------
function initializeTripTypeLogic() {
    const radioButtons = document.querySelectorAll('input[name="trip-type"]');
    const fechaVueltaGroup = document.getElementById('fecha-vuelta-group');
    const fechaVueltaInput = document.getElementById('fecha-vuelta');

    if (!radioButtons.length) return;

    radioButtons.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.id === 'ida-vuelta') {
                // Muestra el campo de fecha de vuelta
                if (fechaVueltaGroup) fechaVueltaGroup.style.display = 'flex';
                if (fechaVueltaInput) fechaVueltaInput.setAttribute('required', 'required');
            } else if (radio.id === 'solo-ida') {
                // Oculta el campo de fecha de vuelta
                if (fechaVueltaGroup) fechaVueltaGroup.style.display = 'none';
                if (fechaVueltaInput) fechaVueltaInput.removeAttribute('required');
            }
        });
    });
}

// -----------------------------------------------------
// FUNCIÓN 5: LÓGICA DE INFORMACIÓN DE DESTINO (Específica para index.html/Vuelos)
// -----------------------------------------------------
function initializeDestinationInfo() {
    const infoButtons = document.querySelectorAll('.destination-card .btn-info');

    infoButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const card = e.target.closest('.destination-card');
            const title = card.querySelector('h2').textContent;
            const description = card.querySelector('p').textContent;

            // (Lógica simple: mostrar alerta con info)
            alert(`INFO sobre ${title}:\n${description}`);
        });
    });
}

// -----------------------------------------------------
// FUNCIÓN 6: LÓGICA DE RESERVA Y DETALLE (Específica para paquetes.html)
// -----------------------------------------------------
function initializePackageLogic({ openModal }) {
    if (!openModal) return;

    // Obtiene el estado de sesión (asumiendo que Thymeleaf inyecta el valor)
    const sessionStatusElement = document.getElementById('session-status');
    const isUserLoggedIn = sessionStatusElement && sessionStatusElement.value === 'true';

    const reservationModal = document.getElementById('reservation-modal');
    const loginModal = document.getElementById('login-modal');

    const packageNameDisplay = document.getElementById('package-name-display');
    const packageIdInput = document.getElementById('package-id-input');

    const openReserveButtons = document.querySelectorAll('.open-reserve');
    const openDetailButtons = document.querySelectorAll('.open-details');

    // Lógica de RESERVA (Requiere inicio de sesión)
    openReserveButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            // Si no está logueado, pide iniciar sesión
            if (!isUserLoggedIn) {
                alert("Debes iniciar sesión para realizar una reserva.");
                openModal(loginModal);
                return;
            }

            // Si está logueado, abre el modal de reserva
            const card = e.target.closest('.package-card');
            if (card) {
                const packageName = button.getAttribute('data-package-name');
                const packageId = card.getAttribute('data-package-id');

                packageNameDisplay.textContent = packageName;
                packageIdInput.value = packageId;

                openModal(reservationModal);
            }
        });
    });

    // Lógica de DETALLES (No requiere inicio de sesión)
    openDetailButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const targetModalId = button.getAttribute('data-target-modal');
            const targetModal = document.querySelector(targetModalId);
            openModal(targetModal);
        });
    });
}


// -----------------------------------------------------
// FUNCIÓN 7: CARGA DE INCLUDES (HEADER/FOOTER)
// -----------------------------------------------------
async function loadIncludes() {
    const includes = [
        { elementId: 'header-placeholder', file: '/includes/header.html' },
        { elementId: 'footer-placeholder', file: '/includes/footer.html' }
    ];

    for (const item of includes) {
        const element = document.getElementById(item.elementId);
        if (element) {
            try {
                const response = await fetch(item.file);
                if (response.ok) {
                    element.innerHTML = await response.text();
                }
            } catch (error) {
                console.error(`Error al cargar ${item.file}:`, error);
            }
        }
    }

    // Ejecutar funcionalidades que dependen de la carga del Header/Footer (ej. botones de modales)
    const modalHandlers = initializeModalFunctionality();
    initializeCardDots();
    initializePasswordToggle();

    return modalHandlers;
}


// -----------------------------------------------------
// INICIO: LLAMADA PRINCIPAL AL CARGAR EL DOM
// -----------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
    console.log("Cargando includes y funcionalidades base...");

    // 1. Cargar Header y Footer, y obtener manejadores de modales
    const modalHandlers = await loadIncludes();

    // 2. Ejecutar Lógica Específica por Página

    // a. Página de VUELOS (Detecta por la caja de búsqueda)
    if (document.querySelector('.search-box')) {
        console.log("Inicializando lógica de Vuelos.");
        initializeTripTypeLogic();
        initializeDestinationInfo();
    }

    // b. Página de PAQUETES (Detecta por la grilla de paquetes)
    if (document.querySelector('.packages-grid')) {
        console.log("Inicializando lógica de Paquetes.");
        initializePackageLogic(modalHandlers);
    }

    // c. Página de MAPA
    if (document.getElementById('interactive-map')) {
        // La lógica del mapa se ejecuta desde 'mapa.js', que se carga después.
        console.log("Lógica del mapa está delegada a 'mapa.js'.");
    }
});