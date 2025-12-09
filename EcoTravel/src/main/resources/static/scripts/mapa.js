// =================================================================
// MAPA INTERACTIVO DE ECOTRAVEL (USANDO LEAFLET, NOMINATIM y ORS)
// =================================================================

// ⚠️ TU CLAVE DE OPENROUTESERVICE
const ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImU5YWM0MGU2NjllYzRlZjVhMTI0MDJlYjZmMmFiYzZjIiwiaCI6Im11cm11cjY0In0=";
const ORS_SERVICE_URL = 'https://api.openrouteservice.org/v2/directions/driving-car';

// Coordenadas de los destinos principales (Usamos [lat, lon] para setView)
const DESTINOS = {
    "Lima": { lat: -12.0464, lon: -77.0428 },
    "Cusco": { lat: -13.5183, lon: -71.9705 },
    "Arequipa": { lat: -16.4090, lon: -71.5350 },
};

let mapa = null;
let originPoint = null;
let destinationPoint = null;
let originMarker = null;
let destinationMarker = null;
let capaRuta = null; // Para la Polyline ORS
let selectingOrigin = true;
let routingControl = null; // Se mantiene por si se añade L.Routing.control en el futuro, pero no se usa actualmente.

document.addEventListener('DOMContentLoaded', () => {
    // Inicialización del mapa después de un breve retraso
    setTimeout(() => {
        const map = initializeInteractiveMap();
        if (map) {
            initializeMapSearch(map);
        }
    }, 200);
});

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

    // Centramos el mapa en Perú (Zoom 5)
    mapa = L.map('interactive-map').setView([-10.0, -75.0], 5);

    const addDefaultLayer = () => {
        // ⚠️ USAMOS OPENSTREETMAP DIRECTAMENTE SIN GOOGLE MUTANT
        console.log("✅ Usando fondo de OpenStreetMap.");
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(mapa);
    }

    addDefaultLayer(); // Llamada directa

    // Añadir marcadores de los destinos principales de EcoTravel
    for (const nombre in DESTINOS) {
        L.marker([DESTINOS[nombre].lat, DESTINOS[nombre].lon], { title: nombre })
            .addTo(mapa)
            .bindPopup(`<b>${nombre}</b><br>Destino EcoTravel`);
    }

    mapa.invalidateSize();
    return mapa;
}

// -----------------------------------------------------
// FUNCIÓN 2: LÓGICA DE CÁLCULO DE RUTA (OPENROUTESERVICE)
// -----------------------------------------------------

/**
 * Función para formatear la duración de segundos a H/M.
 */
function formatearDuracion(segundos) {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.round((segundos % 3600) / 60);
    return `${horas}h ${minutos}m`;
}

/**
 * Dibuja la ruta usando la API de OpenRouteService.
 */
async function drawRouteORS(start, end, nombreRuta) {
    // 1. Limpiar ruta y marcadores anteriores
    if (capaRuta) mapa.removeLayer(capaRuta);
    if (routingControl) mapa.removeControl(routingControl);

    const infoDiv = document.getElementById('ruta-info');
    infoDiv.innerHTML = "<p>Calculando ruta terrestre (Bus)...</p>";

    // ORS necesita las coordenadas como Lon,Lat
    const startCoords = `${start.lng},${start.lat}`;
    const endCoords = `${end.lng},${end.lat}`;

    // 2. Construir la URL de la solicitud ORS
    const url = `${ORS_SERVICE_URL}?api_key=${ORS_API_KEY}&start=${startCoords}&end=${endCoords}`;

    try {
        const response = await fetch(url, { headers: { 'Accept': 'application/json' } });

        if (!response.ok) {
             const errorData = await response.json();
             throw new Error(`ORS Error: ${errorData.error.message || response.statusText}`);
        }

        const data = await response.json();
        const ruta = data.routes[0];

        if (!ruta) {
            throw new Error("No se pudo encontrar una ruta terrestre válida.");
        }

        const duracionSegundos = ruta.summary.duration;
        const duracionFormateada = formatearDuracion(duracionSegundos);
        const distanciaKm = (ruta.summary.distance / 1000).toFixed(0);

        // 3. Dibujar la ruta en el mapa (Polyline)
        const coordenadas = ruta.geometry.coordinates.map(coord => [coord[1], coord[0]]); // ORS es [lon, lat], Leaflet es [lat, lon]
        capaRuta = L.polyline(coordenadas, { color: 'darkred', weight: 4 }).addTo(mapa);

        // 4. Ajustar el mapa para que se vea toda la ruta
        mapa.fitBounds(capaRuta.getBounds());

        // 5. Mostrar información de EcoTravel en el sidebar
        infoDiv.innerHTML = `
            <h3>Ruta: ${nombreRuta}</h3>
            <p><strong>Tiempo Estimado (Bus):</strong> ${duracionFormateada}</p>
            <p><strong>Distancia:</strong> ${distanciaKm} km</p>
            <p class="impacto-eco">🌿 ${nombreRuta} en bus emite <span style="font-weight: bold;">~90% menos CO2</span> que en avión. ¡Viaja sostenible!</p>
        `;

    } catch (error) {
        console.error("Error al calcular la ruta con ORS:", error);
        infoDiv.innerHTML = `<p style="color: red;">Error al calcular ruta: ${error.message}</p>`;
    }
}

// -----------------------------------------------------
// FUNCIÓN 3: LÓGICA DE BÚSQUEDA Y MANEJO DE PUNTOS (NOMINATIM)
// -----------------------------------------------------
function initializeMapSearch(map) {
    const input = document.getElementById('search-destination-input');
    const searchButton = document.getElementById('search-button');
    const recommendationItems = document.querySelectorAll('.recommendation-item');

    // Nota: Las variables de estado (originPoint, destinationPoint, etc.) están definidas globalmente o en el scope exterior.

    const setWaypoint = (lat, lon, name) => {
            const latlng = L.latLng(lat, lon);

            if (selectingOrigin) {
                if (originMarker) map.removeLayer(originMarker);
                originPoint = latlng;

                originMarker = L.marker(latlng, { icon: L.ExtraMarkers.icon({ icon: 'fa-user', markerColor: 'green' }), title: name || 'Origen' })
                    .addTo(map)
                    .bindPopup(`<b>Origen: ${name || 'Punto en mapa'}</b>`)
                    .openPopup();

                selectingOrigin = false;
                console.log(`Origen fijado: ${name || 'Punto en mapa'}. Ahora selecciona el Destino.`);

            } else {
                if (destinationMarker) map.removeLayer(destinationMarker);
                destinationPoint = latlng;

                destinationMarker = L.marker(latlng, { icon: L.ExtraMarkers.icon({ icon: 'fa-flag-checkered', markerColor: 'darkred' }), title: name || 'Destino' })
                    .addTo(map)
                    .bindPopup(`<b>Destino: ${name || 'Punto en mapa'}</b>`)
                    .openPopup();

                selectingOrigin = true;

                // Llamada crucial al servicio de enrutamiento
                drawRouteORS(originPoint, destinationPoint, `${originMarker.options.title.replace('Origen: ', '')} a ${destinationMarker.options.title.replace('Destino: ', '')}`);

                console.log("Ruta calculada. El siguiente punto que elijas será el nuevo Origen.");
            }
        };

        // A. CLIC DIRECTO EN EL MAPA
        map.on('click', (e) => {
            setWaypoint(e.latlng.lat, e.latlng.lng, 'Clic en el mapa');
        });

    // B. LÓGICA DE GEOCODIFICACIÓN (Búsqueda manual con NOMINATIM)
            const performSearch = async () => {
                const query = input.value.trim();
                if (!query) return;

                // Limpieza de ruta anterior y marcadores
                if (originMarker) map.removeLayer(originMarker);
                if (destinationMarker) map.removeLayer(destinationMarker);
                if (capaRuta) map.removeLayer(capaRuta);
                if (routingControl) map.removeControl(routingControl);

                originPoint = null;
                destinationPoint = null;
                selectingOrigin = true; // Reiniciamos el ciclo a Origen

                try {
                   // 1. URL del servicio Nominatim (Buscando solo en Perú: countrycodes=pe)
                   const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=pe`;

                   // 2. Realizamos la solicitud sin headers que puedan causar problemas
                   const response = await fetch(nominatimUrl, {
                      headers: {
                         "User-Agent": "EcoTravelApp/1.0 (email@example.com)",
                         "Accept-Language": "es"
                      }
                   });


                   if (!response.ok) {
                      // Si la respuesta HTTP no es 200 (OK), lanzamos error
                      throw new Error(`Error de red o servicio de búsqueda (${response.status})`);
                   }

                   const data = await response.json();

                   if (data && data.length > 0) {
                       const firstResult = data[0];
                       const lat = parseFloat(firstResult.lat);
                       const lon = parseFloat(firstResult.lon);
                       const name = firstResult.display_name.split(',')[0] || query;

                       // Establece el punto buscado como Origen e inicia el ciclo
                       setWaypoint(lat, lon, name);
                       map.setView([lat, lon], 13); // Zoom 13 es un buen nivel de ciudad

                   } else {
                       alert(`No se encontraron resultados en Perú para "${query}".`);
                   }
                } catch (error) {
                     console.error("Error en la geocodificación (Nominatim):", error);
                     // Este es el alert que ves cuando la búsqueda falla
                     alert(`Ocurrió un error al buscar el destino. Por favor, asegúrate de escribir bien el nombre.`);
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

        // 2. Lógica de selección de las recomendaciones (Usa las coordenadas fijas del HTML)
        recommendationItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const lat = parseFloat(e.target.getAttribute('data-lat'));
                const lon = parseFloat(e.target.getAttribute('data-lon'));
                const name = e.target.getAttribute('data-name');

                if (lat && lon && name) {
                    setWaypoint(lat, lon, name);
                }
            });
        });
    }