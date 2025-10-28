
// -----------------------------------------------------
// FUNCIÓN 1: INICIALIZACIÓN DEL MAPA INTERACTIVO (GLOBAL)
// -----------------------------------------------------
function initializeInteractiveMap() {
    const mapContainer = document.getElementById('interactive-map');
    
    if (!mapContainer || typeof L === 'undefined') {
        console.error("Contenedor del mapa no encontrado o Leaflet no está cargado.");
        return;
    }
    
    console.log("Inicializando mapa interactivo...");
    
    // 1. Inicializa el mapa
    const map = L.map('interactive-map').setView([-12.046, -77.042], 13); 

    // **NUEVA FUNCIÓN DE ESPERA** para cargar la capa de Google
    const addGoogleLayer = () => {
        // Verifica si el plugin GoogleMutant y la API de Google están cargados
        if (typeof L.gridLayer.googleMutant === 'function' && typeof google !== 'undefined') {
            console.log("✅ Usando fondo de Google Maps (Leaflet.GoogleMutant).");
            L.gridLayer.googleMutant({
                type: 'roadmap' // Tipo de mapa: 'roadmap', 'satellite', 'terrain', 'hybrid'
            }).addTo(map);
        } else {
            // Fondo por defecto: OpenStreetMap
            console.log("⚠️ Fallback: Usando fondo de OpenStreetMap.");
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(map);
        }
    }
    
    // A diferencia del código anterior, aquí damos un tiempo extra de 100ms
    // para que la API de Google termine de inicializarse después de Leaflet.
    setTimeout(addGoogleLayer, 100); 

    // 3. Inicializa la lógica de búsqueda y enrutamiento
    initializeMapSearch(map); 

    // 4. Solución para el bug de visualización
    map.invalidateSize(); 
    return map; 
}

// -----------------------------------------------------
// FUNCIÓN NUEVA: LÓGICA DE BÚSQUEDA, MANEJO DE PUNTOS Y ENRUTAMIENTO
// -----------------------------------------------------
function initializeMapSearch(map) {
    const input = document.getElementById('search-destination-input');
    const searchButton = document.getElementById('search-button');
    const recommendationItems = document.querySelectorAll('.recommendation-item');

    // ESTADOS CLAVE PARA EL ENRUTAMIENTO INTERACTIVO
    let originPoint = null;         // Coordenadas del punto de Origen (L.LatLng)
    let destinationPoint = null;    // Coordenadas del punto de Destino (L.LatLng)
    let originMarker = null;        // Marcador del Origen (L.Marker)
    let destinationMarker = null;   // Marcador del Destino (L.Marker)
    let routingControl = null;      // Objeto para manejar la ruta (L.Routing.control)
    
    // Indica si estamos seleccionando el Origen o el Destino
    let selectingOrigin = true;
    
    // -----------------------------------------------------------
    // FUNCIÓN CENTRAL: DIBUJAR RUTA
    // -----------------------------------------------------------
    const drawRoute = () => {
        // 1. Limpiar la ruta anterior si existe
        if (routingControl) {
            map.removeControl(routingControl);
            routingControl = null;
        }

        // 2. Si tenemos Origen Y Destino, dibuja la ruta
        if (originPoint && destinationPoint) {
            console.log("Dibujando ruta entre Origen y Destino...");
            
            // Creamos el control de enrutamiento
            routingControl = L.Routing.control({
                waypoints: [
                    originPoint, 
                    destinationPoint 
                ],
                routeWhileDragging: false,
                router: L.Routing.osrmv1({
                    serviceUrl: 'https://router.project-osrm.org/route/v1' 
                }),
                showAlternatives: false,
                fitSelectedRoutes: true,
                language: 'es',
                lineOptions: {
                    styles: [{ color: '#006600', opacity: 0.8, weight: 6 }] // Línea verde de EcoTravel
                }
            }).addTo(map);
        }
    };
    
    // -----------------------------------------------------------
    // FUNCIÓN DE ASIGNACIÓN DE PUNTO (Clic en Mapa / Búsqueda / Recomendación)
    // -----------------------------------------------------------
    const setWaypoint = (lat, lon, name) => {
        const latlng = L.latLng(lat, lon);
        
        // 1. Limpiar el marcador anterior del punto que vamos a reemplazar
        if (selectingOrigin) {
            if (originMarker) map.removeLayer(originMarker);
            originPoint = latlng;
            
            originMarker = L.marker(latlng, { icon: L.ExtraMarkers.icon({ icon: 'fa-user', markerColor: 'green' }), title: name || 'Origen' })
                .addTo(map)
                .bindPopup(`<b>Origen: ${name || 'Punto en mapa'}</b>`)
                .openPopup();
            
            selectingOrigin = false; // El próximo punto será el Destino
            alert(`Origen fijado: ${name || 'Punto en mapa'}. ¡Ahora busca o haz clic en el Destino!`);
            
        } else {
            if (destinationMarker) map.removeLayer(destinationMarker);
            destinationPoint = latlng;
            
            destinationMarker = L.marker(latlng, { icon: L.ExtraMarkers.icon({ icon: 'fa-flag-checkered', markerColor: 'darkred' }), title: name || 'Destino' })
                .addTo(map)
                .bindPopup(`<b>Destino: ${name || 'Punto en mapa'}</b>`)
                .openPopup();
            
            selectingOrigin = true; // El próximo punto será un nuevo Origen
            drawRoute(); // Dibuja la ruta, pues ya tenemos Origen y Destino
            alert("Ruta calculada. El siguiente punto que elijas será el nuevo Origen.");
        }
    };


    // -----------------------------------------------------------
    // MANEJO DE EVENTOS
    // -----------------------------------------------------------

    // A. CLIC DIRECTO EN EL MAPA
    map.on('click', (e) => {
        setWaypoint(e.latlng.lat, e.latlng.lng, 'Clic en el mapa');
    });
    
    // B. LÓGICA DE GEOCODIFICACIÓN (Búsqueda manual) - ¡ACTUALIZADO CON GOOGLE API!
    const performSearch = async () => {
        const query = input.value.trim();
        if (!query) return;
        
        // Limpiamos los puntos, ya que la búsqueda inicia una nueva secuencia
        originPoint = null;
        destinationPoint = null;
        if (originMarker) map.removeLayer(originMarker);
        if (destinationMarker) map.removeLayer(destinationMarker);
        if (routingControl) map.removeControl(routingControl);
        selectingOrigin = true; // Reiniciamos para que el resultado de la búsqueda sea el Origen

        // Verificación de la API de Google Maps (el servicio Geocoder)
        if (typeof google === 'undefined' || typeof google.maps.Geocoder === 'undefined') {
             console.error("Google Maps API (Geocoder) no cargada. No se puede buscar.");
             alert("Error: El servicio de búsqueda (Google API) no está disponible.");
             return;
        }

        const geocoder = new google.maps.Geocoder();
        
        try {
            // Utilizamos el método geocode de Google
            const result = await geocoder.geocode({
                address: query,
                componentRestrictions: {
                    country: 'PE', // Restringe al país (Perú)
                }
            });

            if (result.results && result.results.length > 0) {
                const firstResult = result.results[0];
                const lat = firstResult.geometry.location.lat();
                const lon = firstResult.geometry.location.lng();
                const name = firstResult.formatted_address.split(',')[0];
                
                setWaypoint(lat, lon, name);
                map.setView([lat, lon], 15);
                
            } else {
                alert(`No se encontraron resultados para "${query}".`);
            }
        } catch (error) {
            console.error("Error en la geocodificación (Google API):", error);
            // El status del error de Google (ej: ZERO_RESULTS, OVER_QUERY_LIMIT)
            alert(`Ocurrió un error al buscar el destino: ${error.message || 'Error desconocido.'}`);
        }
    };

    // 1. Evento de click/Enter para la búsqueda manual
    if (searchButton) {
        searchButton.addEventListener('click', performSearch);
    }
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); 
                performSearch();
            }
        });
    }

    // 2. Lógica de selección de las recomendaciones (clic en la barra lateral)
    recommendationItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const coordsStr = e.target.getAttribute('data-coords');
            const name = e.target.getAttribute('data-name');
            
            if (coordsStr) {
                const [lat, lon] = coordsStr.split(',').map(c => parseFloat(c.trim()));
                setWaypoint(lat, lon, name); 
            }
        });
    });
}

// -----------------------------------------------------
// FUNCIÓN 2: FUNCIÓN MODAL (GLOBAL) - Sin cambios
// -----------------------------------------------------
function initializeModalFunctionality() {
    const loginModal = document.getElementById('login-modal');
    const registerModal = document.getElementById('register-modal');
    
    const openLoginBtn = document.querySelector('.btn-login');
    const openRegisterBtn = document.querySelector('.btn-register');

    const closeModals = document.querySelectorAll('.close-modal');
    const openRegisterLink = document.getElementById('open-register-from-login');
    const openLoginLink = document.getElementById('open-login-from-register');

    const openModal = (modal) => {
        if (modal) modal.style.display = 'flex'; 
    };

    const closeModal = (modal) => {
        if (modal) modal.style.display = 'none';
    };

    if (openLoginBtn) openLoginBtn.addEventListener('click', () => openModal(loginModal));
    if (openRegisterBtn) openRegisterBtn.addEventListener('click', () => openModal(registerModal));

    closeModals.forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal(loginModal);
            closeModal(registerModal);
        });
    });

    if (openRegisterLink) {
        openRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal(loginModal);
            openModal(registerModal);
        });
    }

    if (openLoginLink) {
        openLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal(registerModal);
            openModal(loginModal);
        });
    }
}

// -----------------------------------------------------
// FUNCIÓN 3: LÓGICA DE DOTS (GLOBAL) - Sin cambios
// -----------------------------------------------------
function initializeCardDots() {
    console.log("Inicializando lógica de dots y tarjetas...");
    
    document.querySelectorAll('.destination-card').forEach(card => {
        const dots = card.querySelectorAll('.preview-dot');
        const mainImage = card.querySelector('.card-image'); 
        
        dots.forEach(dot => {
            if (dot === card.querySelector('.preview-dot:first-child')) {
               dot.classList.add('active');
            }
            
            // Lógica para cambiar la imagen y la clase activa
            const changeImageAndActiveDot = () => {
                dots.forEach(d => d.classList.remove('active'));
                dot.classList.add('active');
                
                const newImageSrc = dot.getAttribute('data-image') || dot.getAttribute('data-preview-src');
                
                if (mainImage && newImageSrc) {
                    mainImage.src = newImageSrc;
                }
            };
            
            // 1. EVENTO MOUSEOVER (Al pasar el ratón)
            dot.addEventListener('mouseover', changeImageAndActiveDot); 
            
            // 2. EVENTO CLICK (Al hacer clic)
            dot.addEventListener('click', changeImageAndActiveDot);
        });
    });
}

// -----------------------------------------------------
// FUNCIÓN NUEVA: LÓGICA DE TOGGLE DE CONTRASEÑA
// -----------------------------------------------------
function initializePasswordToggle() {
    const toggleButtons = document.querySelectorAll('.toggle-password');

    toggleButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const targetId = e.target.getAttribute('data-target');
            const passwordInput = document.getElementById(targetId);

            if (passwordInput) {
                // 1. Alternar el tipo de input (password <-> text)
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);

                // 2. Alternar el ícono (eye <-> eye-slash)
                e.target.classList.toggle('fa-eye');
                e.target.classList.toggle('fa-eye-slash');
            }
        });
    });
}

// -----------------------------------------------------
// FUNCIÓN NUEVA: RESTRICCIÓN DE ENTRADA (SOLO LETRAS) - CORREGIDA
// -----------------------------------------------------
/*function initializeInputRestrictions() {
    // CAMBIO CRÍTICO AQUÍ: 'reg-name' debe ser 'reg-nombre'
    const nameInput = document.getElementById('reg-nombre'); 
    
    // Este ya estaba correcto:
    const apellidoInput = document.getElementById('reg-apellido');

    const restrictToLetters = (event) => {
        let value = event.target.value;
        
        // Expresión regular que solo permite letras, espacios y acentos.
        const filteredValue = value.replace(/[^A-Za-zñÑáéíóúÁÉÍÓÚ\s]/g, ''); 
        
        if (value !== filteredValue) {
            event.target.value = filteredValue;
        }
    };

    if (nameInput) {
        nameInput.addEventListener('input', restrictToLetters);
    }

    if (apellidoInput) {
        apellidoInput.addEventListener('input', restrictToLetters);
    }
}*/

// -----------------------------------------------------
// FUNCIÓN NUEVA: MÁSCARA DE FECHA DD/MM/AA
// -----------------------------------------------------
/*function initializeDateMask() {
    const dobInput = document.getElementById('register-dob');

    if (dobInput) {
        dobInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, ''); // 1. Elimina cualquier cosa que no sea número
            
            // Si el usuario está borrando, no aplicamos el formateo automático
            if (e.inputType === 'deleteContentBackward') {
                return;
            }

            // 2. Añadir la primera barra (después de DD)
            if (value.length > 2) {
                value = value.substring(0, 2) + '/' + value.substring(2);
            }
            
            // 3. Añadir la segunda barra (después de MM)
            if (value.length > 5) {
                value = value.substring(0, 5) + '/' + value.substring(5);
            }
            
            // 4. Limitar a DD/MM/AA
            if (value.length > 8) {
                value = value.substring(0, 8);
            }

            e.target.value = value;
        });
    }
}*/

// -----------------------------------------------------
// FUNCIÓN 4: CARGA DE INCLUDES (GLOBAL) - Sin cambios
// -----------------------------------------------------
async function loadIncludes() {
    const includes = [
        { elementId: 'header-placeholder', file: '/includes/header.html' },
        { elementId: 'footer-placeholder', file: '/includes/footer.html' }/*,
        { elementId: 'modals-placeholder', file: '/modals.html' }*/
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
                console.error("Error de red o procesamiento:", error);
            }
        }
    }
    
    // Ejecutar funcionalidades DESPUÉS de cargar Header/Footer/Modals
    initializeModalFunctionality();
    initializeCardDots(); 
    initializePasswordToggle(); 
    //initializeDateMask();
    //initializeInputRestrictions();
}

// -----------------------------------------------------
// INICIO (Llamada al cargar el DOM) - VERSIÓN SINCRONIZADA
// -----------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Cargamos el header, footer y modales (usando await, puede tardar).
    console.log("Cargando includes y funcionalidades base...");
    await loadIncludes();
    
    // 2. Inicializamos el mapa. Aplicamos un retraso.
    // ESTO ES CRUCIAL: El retraso da tiempo al navegador para procesar los scripts
    // de Leaflet.ExtraMarkers y Leaflet-Routing-Machine que se cargaron en el HTML.
    if (document.getElementById('interactive-map')) {
        setTimeout(() => {
            console.log("Scripts externos definidos. Inicializando mapa y eventos.");
            initializeInteractiveMap();
        }, 200); // 200 milisegundos para mayor seguridad
    }
});