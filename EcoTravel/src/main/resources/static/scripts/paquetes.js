// =================================================================
// CLAVE DE API Y CONFIGURACIÓN
// =================================================================
const GEMINI_API_KEY = SERVER_CONFIG.apiKey;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=" + GEMINI_API_KEY;

function convertMarkdownToHtml(markdownText) {
    let htmlText = markdownText.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    htmlText = htmlText.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    htmlText = htmlText.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    htmlText = htmlText.replace(/^\* (.*$)/gim, '<li>$1</li>');
    if (htmlText.includes('<li>')) {
        htmlText = `<ul>${htmlText}</ul>`;
    }
    htmlText = htmlText.replace(/^---$/gim, '<hr>');
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

    if(routeDurationDisplay) routeDurationDisplay.textContent = duration;
    if(routeDistanceDisplay) routeDistanceDisplay.textContent = distance;

    if(geminiInsights) {
        geminiInsights.innerHTML = '<p>⚙️ <span style="font-weight: bold;">Gemini está analizando la ruta...</span></p>';
    }

    const promptText = `Eres un experto en turismo sostenible en Perú y un asistente para el paquete "${packageName}".
        El plan de viaje preestablecido es: **${dailyPlan}**.
        La ruta de llegada es: ${arrivalRoute}.
        La ruta principal dentro del paquete es ${startCity} a ${endCity} (${distance}, ${duration}).
        Genera un breve análisis en español (máximo 4 párrafos) que cumpla con los siguientes criterios:
        1. Un "EcoTip" sobre cómo optimizar la movilidad.
        2. Tres "Lugares a Visitar" imperdibles cercanos.
        3. Usa emojis y Markdown.`;

    const requestBody = { contents: [{ role: "user", parts: [{ text: promptText }] }] };

    try {
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody)
        });

        if (!response.ok) throw new Error(`Error API.`);

        const data = await response.json();
        const generatedText = data.candidates[0].content.parts[0].text;
        const formattedHtml = convertMarkdownToHtml(generatedText);

        if(geminiInsights) {
            geminiInsights.innerHTML = `<div style="background-color: #e6ffe6; border-left: 5px solid #00a000; padding: 10px; border-radius: 4px;">${formattedHtml}</div>`;
        }
    } catch (error) {
        console.error("❌ ERROR GEMINI:", error);
        if(geminiInsights) geminiInsights.innerHTML = `<p style="color: red;">❌ Error al cargar IA.</p>`;
    }
}

// ----------------------------------------------------------------
// FUNCIÓN 2: LÓGICA PRINCIPAL (DOM LOADED)
// ----------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {

    // ============================================================
    // A. FORMATO DE TARJETA Y PRECIOS
    // ============================================================
    const ccInput = document.getElementById('cc-number');
    const expiryInput = document.getElementById('cc-expiry');
    const diasInput = document.getElementById('res-dias');
    const personasInput = document.getElementById('res-personas');
    const livePriceSpan = document.getElementById('live-price');
    const basePriceInput = document.getElementById('base-price-input');

    if (ccInput) {
        ccInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '').substring(0, 16);
            e.target.value = value.match(/.{1,4}/g)?.join(' ') || value;
        });
    }

    if (expiryInput) {
        expiryInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '').substring(0, 4);
            if (value.length >= 2) e.target.value = value.substring(0, 2) + '/' + value.substring(2);
            else e.target.value = value;
        });
    }

    function updatePrice() {
        const dias = parseInt(diasInput.value) || 1;
        const personas = parseInt(personasInput.value) || 1;
        const basePrice = parseFloat(basePriceInput.value) || 0;
        const total = dias * personas * basePrice;
        if(livePriceSpan) livePriceSpan.textContent = `$ ${total.toFixed(2)} USD`;
    }

    if(diasInput && personasInput) {
        diasInput.addEventListener('input', updatePrice);
        personasInput.addEventListener('input', updatePrice);
    }

    // ============================================================
    // B. BOTÓN RESERVAR (LÓGICA HÍBRIDA + DÍAS FIJOS)
    // ============================================================
    const btnReservar = document.querySelectorAll('.open-reserve');

    btnReservar.forEach(button => {
        button.addEventListener('click', (e) => {
            const sessionStatus = document.getElementById('session-status');
            const isLogged = sessionStatus && sessionStatus.value === 'true';

            if (!isLogged) {
                const loginModal = document.getElementById('login-modal');
                const loginRedirect = document.getElementById('login-redirect-url');
                if (loginModal) {
                    if(loginRedirect) loginRedirect.value = window.location.pathname;
                    loginModal.style.display = 'flex';
                } else {
                    alert("Inicia sesión para reservar.");
                }
                return;
            }

            try {
                const card = button.closest('.package-card, .destination-card');
                if (!card) return;

                // Datos
                const packageId = card.getAttribute('data-package-id') || button.getAttribute('data-package-id');
                const nombre = button.getAttribute('data-package-name');
                let rawDuration = button.getAttribute('data-duration');
                const distance = button.getAttribute('data-distance');
                const arrivalRoute = button.getAttribute('data-arrival-route');
                const dailyPlan = button.getAttribute('data-daily-plan');

                // Precios y Lógica de Días
                let pricePerDay = parseFloat(button.getAttribute('data-price-per-day'));
                let finalDays = 1;
                let isFixed = false;

                // Si no tiene precio por día definido, es un paquete fijo (Paquetes.html)
                // Lógica Estricta de Días Fijos
                if (packageId.includes('LIMA_HIST')) {
                    finalDays = 3;
                    isFixed = true;
                    pricePerDay = 116.66;
                } else if (packageId.includes('AREQUIPA_CAN')) {
                    finalDays = 5;
                    isFixed = true;
                    pricePerDay = 124.0;
                } else if (packageId.includes('CUSCO_INKA')) {
                    // 🟢 CAMBIO: CUSCO FIJO A 7 DÍAS
                    finalDays = 7;
                    isFixed = true;
                    pricePerDay = 157.14; // ($1100 / 7 días)
                } else {
                    // Index (Flexible)
                    const attrPrice = parseFloat(button.getAttribute('data-price-per-day'));
                    pricePerDay = attrPrice || 100;
                    finalDays = 1;
                    isFixed = false;
                }

                // Configurar Input de Días
                if (diasInput) {
                    diasInput.value = finalDays;
                    diasInput.readOnly = isFixed;

                    if (isFixed) {
                        diasInput.style.backgroundColor = "#e9ecef";
                        diasInput.style.cursor = "not-allowed";
                        diasInput.title = "Duración fija del paquete.";
                    } else {
                        diasInput.style.backgroundColor = "white";
                        diasInput.style.cursor = "text";
                        diasInput.title = "Elige la duración.";
                    }
                }

                // Ruta
                let startCity = "Origen", endCity = "Destino";
                const routeSummary = card.querySelector('.route-summary p:first-child');
                if (routeSummary) {
                    const match = routeSummary.textContent.match(/Ruta:\s*(.+?)\s*→\s*(.+?)\s*(\(.+\))?/);
                    if (match) { startCity = match[1].trim(); endCity = match[2].trim(); }
                } else if (nombre) {
                    startCity = nombre.split(':')[0] || "Origen";
                }

                // Actualizar Modal
                if(document.getElementById('package-id-input')) document.getElementById('package-id-input').value = packageId;
                if(document.getElementById('package-name-display')) document.getElementById('package-name-display').textContent = nombre;

                if(basePriceInput) basePriceInput.value = pricePerDay;
                if(personasInput) personasInput.value = 1;

                updatePrice();

                // Mostrar Rutina
                const planContainer = document.getElementById('daily-plan-base');
                if (planContainer) {
                    if (dailyPlan) {
                        let html = '<h5>📅 Rutina Base:</h5><ul>';
                        dailyPlan.split('|').forEach(d => html += `<li>${d.trim()}</li>`);
                        html += '</ul>';
                        planContainer.innerHTML = html;
                    } else {
                        planContainer.innerHTML = '<p>No disponible.</p>';
                    }
                }

                // Llamar IA
                if (nombre) fetchGeminiRouteAnalysis(nombre, startCity, endCity, rawDuration, distance, arrivalRoute, dailyPlan);

                // Abrir Modal
                const modal = document.getElementById('reservation-modal');
                if(modal) modal.style.display = 'flex';

            } catch (error) { console.error(error); }
        });
    });

    // ============================================================
    // C. CERRAR MODALES
    // ============================================================
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', () => {
            const overlay = button.closest('.modal-overlay');
            if (overlay) overlay.style.display = 'none';
        });
    });

    // ============================================================
    // D. CARRUSEL
    // ============================================================
    const packagesGrid = document.getElementById('packages-grid');
    if (packagesGrid) {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const cards = document.querySelectorAll('.package-card');

        if (cards.length > 0) {
            const firstClone = cards[0].cloneNode(true);
            const lastClone = cards[cards.length - 1].cloneNode(true);
            packagesGrid.appendChild(firstClone);
            packagesGrid.insertBefore(lastClone, cards[0]);

            const allCards = packagesGrid.querySelectorAll('.package-card');
            let idx = 1;
            let transitioning = false;

            function update() {
                allCards.forEach(c => c.classList.remove('active'));
                allCards[idx].classList.add('active');
            }

            function slide(index) {
                transitioning = true;
                idx = index;
                const card = allCards[idx];
                const offset = card.offsetLeft - (packagesGrid.offsetWidth - (card.offsetWidth + 20)) / 2;
                packagesGrid.style.transform = `translateX(-${offset}px)`;
                update();
            }

            function reset(index) {
                packagesGrid.style.transition = 'none';
                slide(index);
                void packagesGrid.offsetWidth;
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        packagesGrid.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                        transitioning = false;
                    });
                });
            }

            packagesGrid.addEventListener('transitionend', () => {
                if (!transitioning) return;
                if (idx === 0) reset(cards.length);
                else if (idx === allCards.length - 1) reset(1);
                else transitioning = false;
            });

            if(prevBtn) prevBtn.addEventListener('click', () => { if (!transitioning) slide(idx - 1); });
            if(nextBtn) nextBtn.addEventListener('click', () => { if (!transitioning) slide(idx + 1); });

            setTimeout(() => reset(1), 100);
            window.addEventListener('resize', () => reset(idx));
            update();
        }
    }

    // ============================================================
    // E. IMPRESIÓN/PDF NATIVO 🖨️
    // ============================================================
    const btnDownloadPdf = document.getElementById('btn-download-pdf');
    if (btnDownloadPdf) {
        btnDownloadPdf.addEventListener('click', () => {

            const content = document.getElementById('content-to-print');
            const packageName = document.getElementById('package-name-display')?.textContent || 'Guia';

            if (!content) return;

            const printWindow = window.open('', '', 'height=600,width=800');
            printWindow.document.write('<html><head><title>Guía EcoTravel: ' + packageName + '</title>');
            printWindow.document.write('<style>');
            printWindow.document.write('body { font-family: sans-serif; padding: 20px; color: #333; }');
            printWindow.document.write('h2, h3, h4 { color: #38761d; }');
            printWindow.document.write('.info-box { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }');
            printWindow.document.write('ul { line-height: 1.6; }');
            printWindow.document.write('</style>');
            printWindow.document.write('</head><body>');

            printWindow.document.write('<h1>EcoTravel - Guía de Viaje</h1>');
            printWindow.document.write('<h2>' + packageName + '</h2>');
            printWindow.document.write(content.innerHTML);
            printWindow.document.write('<hr><p style="text-align:center; font-size:0.8em; color:#666;">Generado por EcoTravel IA</p>');
            printWindow.document.write('</body></html>');

            printWindow.document.close();
            printWindow.focus();

            setTimeout(() => {
                printWindow.print();
            }, 500);
        });
    }

});