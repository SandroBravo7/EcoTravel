// =================================================================
// CLAVE DE API Y CONFIGURACIÓN
// =================================================================
const GEMINI_API_KEY = "AIzaSyAvGfPpwSERja4CoIvmYn2AU_EtZHmtoRE"; // <-- ¡Tu nueva clave!
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=" + GEMINI_API_KEY;

function convertMarkdownToHtml(markdownText) {
    // 1. Encabezados ## -> <h2>
    let htmlText = markdownText.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    // 2. Encabezados ### -> <h3>
    htmlText = htmlText.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    // 3. Negritas **texto** -> <strong>texto</strong>
    htmlText = htmlText.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    // 4. Listas (simple * )
    htmlText = htmlText.replace(/^\* (.*$)/gim, '<li>$1</li>');
    if (htmlText.includes('<li>')) {
        htmlText = `<ul>${htmlText}</ul>`;
    }
    // 5. Línea horizontal ---
    htmlText = htmlText.replace(/^---$/gim, '<hr>');
    // 6. Nueva línea \n\n -> <p> (para bloques de párrafo)
    htmlText = htmlText.replace(/\n\n/g, '</p><p>');

    return `<p>${htmlText}</p>`;
}

// ----------------------------------------------------------------
// FUNCIÓN 1: LLAMADA A LA API DE GEMINI
// ----------------------------------------------------------------
async function fetchGeminiRouteAnalysis(packageName, startCity, endCity, duration, distance, arrivalRoute, dailyPlan) {
    const geminiInsights = document.getElementById('gemini-insights');
    const routeDurationDisplay = document.getElementById('route-duration-display');
    const routeDistanceDisplay = document.getElementById('route-distance-display');

    console.log('✅ DEBUG: Iniciando fetchGeminiRouteAnalysis...');

    // Muestra los datos fijos del paquete
    routeDurationDisplay.textContent = duration;
    routeDistanceDisplay.textContent = distance;

    geminiInsights.innerHTML = '<p>⚙️ <span style="font-weight: bold;">Gemini está analizando la ruta...</span></p>';

    // 🛑 Modificación del PROMPT para usar el dailyPlan 🛑
        const promptText = `Eres un experto en turismo sostenible en Perú y un asistente para el paquete "${packageName}".

        El plan de viaje preestablecido es: **${dailyPlan}**.
        La ruta de llegada es: ${arrivalRoute}.
        La ruta principal dentro del paquete es ${startCity} a ${endCity} (${distance}, ${duration}).

        Genera un breve análisis en español (máximo 4 párrafos) que cumpla con los siguientes criterios, basándote *directamente* en los lugares mencionados en el plan diario:
        1. Un "EcoTip" sobre cómo optimizar la movilidad o reducir el impacto en los **días 2 y 3 del plan**.
        2. Tres "Lugares a Visitar" imperdibles (ecológicos, culturales o gastronómicos) que **queden cerca o complementen** los puntos ya mencionados en el plan diario (ej. si el plan dice Barranco, recomienda una galería cercana).
        3. Usa emojis y Markdown (encabezados, negritas).
        `;

    const requestBody = {
        contents: [{ role: "user", parts: [{ text: promptText }] }]
    };

    try {
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error ${response.status}: ${errorData.error.message}. La clave API podría ser inválida.`);
        }

        const data = await response.json();
                const generatedText = data.candidates[0].content.parts[0].text;

                // 🛑 Llama a la nueva función de conversión 🛑
                const formattedHtml = convertMarkdownToHtml(generatedText);

                geminiInsights.innerHTML = `
                    <div style="background-color: #e6ffe6; border-left: 5px solid #00a000; padding: 10px; border-radius: 4px;">
                        ${formattedHtml}  </div>
                `;
                console.log('✅ DEBUG: Respuesta de Gemini recibida con éxito.');

    } catch (error) {
        console.error("❌ ERROR CRÍTICO DE GEMINI:", error);
        geminiInsights.innerHTML = `<p style="color: red; font-weight: bold;">❌ Error: ${error.message}</p>`;
    }
}

// ----------------------------------------------------------------
// FUNCIÓN 2: LÓGICA DE INTERFAZ Y EVENTOS
// ----------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    const btnReservar = document.querySelectorAll('.open-reserve');

    btnReservar.forEach(button => {
        button.addEventListener('click', (e) => {
            console.log('🔔 DEBUG: Botón Reservar clickeado.');
            const isLogged = document.getElementById('session-status').value === 'true';

            // 🛑 PASO 1: VERIFICAR LA SESIÓN
            if (!isLogged) {
                console.log('🛑 DEBUG: Usuario NO logueado. Abriendo modal de login.');

                const loginModal = document.getElementById('login-modal');
                const loginRedirectUrlInput = document.getElementById('login-redirect-url');

                if (loginModal && loginRedirectUrlInput) {
                    const currentPath = window.location.pathname;
                    loginRedirectUrlInput.value = currentPath;
                    loginModal.style.display = 'flex';
                } else {
                    alert("⛔ Debes iniciar sesión o registrarte para realizar una reserva.");
                }
                return; // Detiene la ejecución AQUI
            }

            // Si está logueado, continua AQUI
            console.log('🟢 DEBUG: Usuario logueado. Procediendo con la reserva.');

            try {
                const packageId = button.closest('.package-card').getAttribute('data-package-id');
                const nombre = button.getAttribute('data-package-name');
                const duration = button.getAttribute('data-duration');
                const distance = button.getAttribute('data-distance');
                const arrivalRoute = button.getAttribute('data-arrival-route'); // 🛑 NUEVA LÍNEA
                const dailyPlan = button.getAttribute('data-daily-plan'); // 🛑 NUEVA LÍNEA

                // Lógica para extraer las ciudades de la ruta
                const routeSummaryElement = button.closest('.card-actions').previousElementSibling.querySelector('.route-summary p:first-child');
                const routeText = routeSummaryElement ? routeSummaryElement.textContent : "";

                const match = routeText.match(/Ruta:\s*(.+?)\s*→\s*(.+?)\s*(\(.+\))?/);
                let startCity = "Punto de partida";
                let endCity = "Destino final";

                if (match) {
                    startCity = match[1].split('(')[0].trim();
                    endCity = match[2].split('(')[0].trim();
                } else {
                     startCity = nombre.split(':')[0].trim();
                     endCity = "Destino Principal";
                }

                // Actualiza los campos ocultos del modal
                document.getElementById('package-id-input').value = packageId;
                document.getElementById('package-name-display').textContent = nombre;

                // 🛑 NUEVA LÓGICA: Mostrar la rutina preestablecida 🛑
                const planContainer = document.getElementById('daily-plan-base');
                if (dailyPlan) {
                    // Dividir la cadena por '|' para obtener los días
                    const daysArray = dailyPlan.split('|');
                    let planHtml = '<h5>📅 Rutina Base Preestablecida:</h5><ul>';
                    daysArray.forEach(day => {
                        planHtml += `<li>${day.trim()}</li>`;
                    });
                    planHtml += '</ul>';
                    planContainer.innerHTML = planHtml;
                } else {
                    planContainer.innerHTML = '<p>No hay rutina diaria preestablecida para este paquete.</p>';
                }
                // 🛑 FIN NUEVA LÓGICA 🛑

                // 🛑 PASO 2: LLAMAR A GEMINI
                fetchGeminiRouteAnalysis(nombre, startCity, endCity, duration, distance, arrivalRoute, dailyPlan);

                // 🛑 PASO 3: ABRIR EL MODAL DE RESERVA
                document.getElementById('reservation-modal').style.display = 'flex';
                console.log('✅ DEBUG: Modal de reserva abierto. Flujo completado.');

            } catch (error) {
                console.error('❌ ERROR de JavaScript en el click handler:', error);
                alert("Ocurrió un error al preparar la reserva. Revisa la consola.");
            }
        });
    });

    // ----------------------------------------------------------------
    // LÓGICA PARA CERRAR EL MODAL
    // ----------------------------------------------------------------
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', () => {
            if (button.closest('.modal-overlay')) {
                button.closest('.modal-overlay').style.display = 'none';
            }
        });
    });

    // ----------------------------------------------------------------
        // 🛑 LÓGICA DEL CARRUSEL DE PAQUETES (INFINITO SIN SALTO) 🛑
        // ----------------------------------------------------------------
        const packagesGrid = document.getElementById('packages-grid');
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');

        const originalCards = document.querySelectorAll('.package-card');
        if (originalCards.length === 0) return;

        // 1. Clonar tarjetas para crear el loop
        const firstClone = originalCards[0].cloneNode(true); // Clonar Lima
        const lastClone = originalCards[originalCards.length - 1].cloneNode(true); // Clonar Cusco

        // Añadir clones al grid
        packagesGrid.appendChild(firstClone); // Grid ahora tiene: [Lima, Arequipa, Cusco, Lima_CLONE]
        packagesGrid.insertBefore(lastClone, originalCards[0]); // Grid ahora tiene: [Cusco_CLONE, Lima, Arequipa, Cusco, Lima_CLONE]

        // Las nuevas tarjetas a controlar (incluyendo clones)
        const allCards = packagesGrid.querySelectorAll('.package-card');
        const totalCards = allCards.length; // 5 tarjetas
        let currentIndex = 1; // 🛑 CRÍTICO: Empezamos en la tarjeta REAL de Lima (índice 1)
        let isTransitioning = false; // Bloquea el botón durante la transición

        function updateCardClasses() {
            // La clase 'active' solo se aplica a las tarjetas originales (índice 1, 2, 3)
            // Se calcula basándose en el índice de la tarjeta original
            const originalIndex = (currentIndex - 1 + originalCards.length) % originalCards.length;

            allCards.forEach((card, index) => {
                card.classList.remove('active');
            });
            // La tarjeta activa es siempre la que está en la posición 'currentIndex'
            allCards[currentIndex].classList.add('active');
        }

        // 🛑 FUNCIÓN DE SALTO RÁPIDO (SIN TRANSICIÓN) 🛑
            function resetPosition(index) {
                packagesGrid.style.transition = 'none'; // Desactiva la transición

                // CRÍTICO: Forzar un reflow (redibujado) del DOM para aplicar 'transition: none'
                // Esto evita que el navegador intente animar el salto.
                void packagesGrid.offsetWidth;

                slideTo(index); // Ejecuta el salto a la posición 1 o 3

                // Volver a activar la transición después de un tiempo mínimo
                setTimeout(() => {
                    packagesGrid.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                    isTransitioning = false;
                }, 50); // Mantenemos el timeout, pero la clave es el 'offsetWidth'
            }

        // Función de desplazamiento central
        function slideTo(index) {
            isTransitioning = true;
            currentIndex = index;

            // 1. Obtener la tarjeta de destino (usando el nuevo índice)
            const targetCard = allCards[currentIndex];

            // 2. Obtener el contenedor visible (.packages-grid)
            const containerWidth = packagesGrid.offsetWidth;

            // 3. Obtener el desplazamiento de la tarjeta objetivo (distancia desde el inicio)
            const targetOffset = targetCard.offsetLeft;

            // 4. Obtener el ancho real de la tarjeta objetivo
            const cardWidth = targetCard.offsetWidth + 20;

            // 5. Calcular la posición central
            const scrollToX = targetOffset - (containerWidth - cardWidth) / 2;

            // Aplicar el desplazamiento
            packagesGrid.style.transform = `translateX(-${scrollToX}px)`;

            // Actualizar la clase 'active'
            updateCardClasses();
        }

        // 🛑 MANEJO DE LA TRANSICIÓN FINAL 🛑
        packagesGrid.addEventListener('transitionend', () => {
            isTransitioning = false;
            // Si estamos en el clon de Cusco (índice 0), saltamos a Cusco original (índice 3)
            if (currentIndex === 0) {
                resetPosition(totalCards - 2);
                return;
            }
            // Si estamos en el clon de Lima (índice 4), saltamos a Lima original (índice 1)
            if (currentIndex === totalCards - 1) {
                resetPosition(1);
                return;
            }
        });

        // Eventos de los botones
        prevBtn.addEventListener('click', () => {
            if (!isTransitioning) {
                slideTo(currentIndex - 1);
            }
        });

        nextBtn.addEventListener('click', () => {
            if (!isTransitioning) {
                slideTo(currentIndex + 1);
            }
        });

        // Inicializar: Muestra la tarjeta de Lima (índice 1) en la posición correcta.
        // Usamos un timeout para asegurar que el DOM ha renderizado y los anchos son correctos,
        // y lo hacemos SIN TRANSICIÓN al inicio para colocar el carrusel en la posición 1.
        setTimeout(() => {
            resetPosition(1); // Muestra Lima (índice 1) sin transición
        }, 50);

        // IMPORTANTE: Recalcular la posición al cambiar el tamaño de la ventana
        window.addEventListener('resize', () => {
            resetPosition(currentIndex); // Usa resetPosition para evitar fallos de cálculo con el transition: 'none'
        });

        // Llamamos a la función de clases al inicio para marcar la tarjeta inicial
        updateCardClasses();
});