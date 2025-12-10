document.addEventListener('DOMContentLoaded', () => {
    const micButton = document.getElementById('btn-microfono');
    const searchInput = document.getElementById('buscador-input');
    const statusText = document.getElementById('estado-mic');

    // Elementos del carrusel para manipular
    const cards = document.querySelectorAll('.package-card');
    const carouselContainer = document.querySelector('.carousel-container');

    // --- LÓGICA DE FILTRADO (Igual que antes) ---
    function filtrarPaquetes(texto) {
        const busqueda = texto.toLowerCase().trim();

        if (busqueda.length > 0) {
            if(carouselContainer) carouselContainer.classList.add('modo-busqueda');
        } else {
            if(carouselContainer) carouselContainer.classList.remove('modo-busqueda');
            cards.forEach(c => c.style.display = '');
            return;
        }

        let encontrados = 0;
        cards.forEach(card => {
            const titulo = card.querySelector('h2').innerText.toLowerCase();
            const resumen = card.querySelector('.route-summary').innerText.toLowerCase();

            if (titulo.includes(busqueda) || resumen.includes(busqueda)) {
                card.style.display = 'block';
                encontrados++;
            } else {
                card.style.display = 'none';
            }
        });

        if (encontrados === 0 && statusText) {
            statusText.innerText = "No encontramos paquetes con: " + texto;
        } else if (statusText) {
            statusText.innerText = "";
        }
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => filtrarPaquetes(e.target.value));
        if (searchInput.value.trim() !== "") filtrarPaquetes(searchInput.value);
    }

    // --- LÓGICA DEL MICRÓFONO MEJORADA ---
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = 'es-PE';
        recognition.continuous = false;
        recognition.interimResults = false;

        if (micButton) {
            micButton.addEventListener('click', () => {
                try {
                    recognition.start();
                    if(statusText) {
                        statusText.innerText = "Escuchando... 🟢 (Habla ahora)";
                        statusText.style.color = "green";
                    }
                } catch (e) {
                    console.log("El micrófono ya estaba activo o hubo un error al iniciar.");
                }
            });
        }

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            let textoLimpio = transcript.replace(/\.$/, "");

            if (searchInput) {
                searchInput.value = textoLimpio;
                filtrarPaquetes(textoLimpio);
            }
            if(statusText) statusText.innerText = "Entendido: " + textoLimpio;
        };

        // 🛑 MANEJO DE ERRORES TRADUCIDOS 🛑
        recognition.onerror = (event) => {
            let mensaje = "Error desconocido.";
            let color = "red";

            switch(event.error) {
                case 'no-speech':
                    mensaje = "🔇 No se escuchó nada. Intenta hablar más fuerte o acércate.";
                    color = "orange";
                    break;
                case 'audio-capture':
                    mensaje = "🔌 No se detecta ningún micrófono conectado.";
                    break;
                case 'not-allowed':
                    mensaje = "🚫 Permiso denegado. Haz clic en el candado junto a la URL para permitir.";
                    break;
                case 'network':
                    mensaje = "⚠️ Error de red. Verifica tu conexión a internet.";
                    break;
                case 'service-not-allowed':
                    mensaje = "❌ Tu navegador bloquea el servicio de voz (prueba Chrome o Edge).";
                    break;
            }

            if(statusText) {
                statusText.innerText = mensaje;
                statusText.style.color = color;
            }
            console.error("Error de voz:", event.error);
        };

        recognition.onend = () => {
             // Restaurar estado después de unos segundos
             setTimeout(() => {
                if(statusText && statusText.innerText.includes("Escuchando")) {
                    statusText.innerText = "";
                }
            }, 3000);
        };

    } else {
        if(micButton) micButton.style.display = 'none';
        console.log("Navegador no soporta voz");
    }
});