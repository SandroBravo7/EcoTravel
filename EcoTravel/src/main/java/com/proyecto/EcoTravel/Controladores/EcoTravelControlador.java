package com.proyecto.EcoTravel.Controladores;

// --- IMPORTS DE JAVA ---
import java.util.ArrayList;
import java.util.List;

// --- IMPORTS DE SPRING & JAKARTA ---
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

// --- IMPORTS DEL PROYECTO ---
import com.proyecto.EcoTravel.DTOs.FormularioRegistro;
import com.proyecto.EcoTravel.DTOs.FormularioReservaPaquete;
import com.proyecto.EcoTravel.modelos.Reserva; // 🛑 Asegúrate de que coincida con tu paquete 'modelos'
import com.proyecto.EcoTravel.modelos.Usuario;
import com.proyecto.EcoTravel.Repositorios.ReservaRepositorio;
import com.proyecto.EcoTravel.Repositorios.UsuarioRepositorio;
import com.proyecto.EcoTravel.Servicios.UsuarioServicio;

@Controller
public class EcoTravelControlador {

    // ==========================================
    // 1. INYECCIÓN DE DEPENDENCIAS Y CONFIGURACIÓN
    // ==========================================

    @Autowired
    private UsuarioServicio usuarioServicio;

    @Autowired
    private UsuarioRepositorio usuarioRepositorio;

    @Autowired
    private ReservaRepositorio reservaRepositorio;

    // Inyectamos la API Key desde secrets.properties (o environment)
    @Value("${google.gemini.key:NO_CONFIGURADO}")
    private String geminiApiKey;

    // ==========================================
    // 2. MÉTODOS DE AUTENTICACIÓN (LOGIN/REGISTRO)
    // ==========================================

    @PostMapping("/registrarse")
    public String registroSubmit(@Valid @ModelAttribute FormularioRegistro form,
                                 BindingResult bindingResult,
                                 Model model,
                                 RedirectAttributes redirectAttributes) {
        if (bindingResult.hasErrors()) {
            model.addAttribute("registroError", "Completa correctamente los campos.");
            return "index";
        }

        try {
            usuarioServicio.registrarNuevoUsuario(form);
            model.addAttribute("registroExitoso", "Registro exitoso. Inicia sesión.");
            return "index";
        } catch (IllegalArgumentException ex) {
            model.addAttribute("registroError", ex.getMessage());
            return "index";
        } catch (Exception ex) {
            model.addAttribute("registroError", "Error interno al registrar");
            return "index";
        }
    }

    @PostMapping("/loguearse")
    public String logeoSubmit(@RequestParam("email") String email,
                              @RequestParam("contraseña") String contraseña,
                              @RequestParam(value = "redirectUrl", required = false) String redirectUrl,
                              HttpSession sesion,
                              Model model) {

        boolean ok = usuarioServicio.autenticar(email, contraseña);
        if (!ok) {
            model.addAttribute("logueoError", "Correo o contraseña incorrectos");
            return "index";
        }

        usuarioServicio.findByEmail(email).ifPresent(u -> {
            sesion.setAttribute("usuarioId", u.getId());
            sesion.setAttribute("usuarioName", u.getNombre());
        });

        // Redirección inteligente tras login
        if (redirectUrl != null && !redirectUrl.isEmpty()) {
            return "redirect:" + redirectUrl;
        }
        return "redirect:/index";
    }

    @GetMapping("/desloguearse")
    public String logout(HttpSession sesion) {
        sesion.invalidate();
        return "redirect:/";
    }

    // --- PROTECCIÓN DE RUTAS GET PARA FORMULARIOS POST ---

    @GetMapping("/loguearse")
    public String logeoGet() { return "redirect:/index"; }

    @GetMapping("/registrarse")
    public String registroGet() { return "redirect:/index"; }


    // ==========================================
    // 3. NAVEGACIÓN PRINCIPAL (VISTAS)
    // ==========================================

    @GetMapping({"/", "/index"})
    public String mostrarInicio(Model model) {
        if (!model.containsAttribute("formularioRegistro")) {
            model.addAttribute("formularioRegistro", new FormularioRegistro());
        }

        // 🟢 AGREGAR ESTA LÍNEA (Igual que en paquetes)
        model.addAttribute("geminiKeyFront", geminiApiKey);

        return "index";
    }

    @GetMapping("/mapa")
    public String mostrarMapa(Model model) {
        agregarFormularioSiNoExiste(model);
        return "mapa";
    }

    @GetMapping("/acerca")
    public String mostrarAcercaDeNosotros(Model model) {
        agregarFormularioSiNoExiste(model);
        return "acerca";
    }

    @GetMapping("/paquetes")
    public String mostrarPaquetes(Model model) {
        agregarFormularioSiNoExiste(model);

        // Enviamos la clave API al Frontend de forma segura
        model.addAttribute("geminiKeyFront", geminiApiKey);

        return "paquetes";
    }


    // ==========================================
    // 4. LÓGICA DE RESERVAS (CRUCIAL)
    // ==========================================

    // ✅ MOSTRAR LA TABLA DE RESERVAS (Leer de BD)
    @GetMapping("/mis-reservas")
    public String mostrarMisReservas(HttpSession session, Model model) {

        // Helper para que funcionen los modales (login/registro) en el header
        if (!model.containsAttribute("formularioRegistro")) {
            model.addAttribute("formularioRegistro", new FormularioRegistro());
        }

        Long usuarioId = (Long) session.getAttribute("usuarioId");
        if (usuarioId == null) return "redirect:/"; // Seguridad

        // 1. Buscar al usuario
        Usuario usuario = usuarioRepositorio.findById(usuarioId).orElse(null);

        // 2. PEDIR AL REPOSITORIO LAS RESERVAS REALES 🔍
        List<Reserva> misReservas = reservaRepositorio.findByUsuario(usuario);

        // 3. Pasarlas al HTML
        model.addAttribute("reservas", misReservas);

        return "mis-reservas";
    }

    // ✅ PROCESAR Y GUARDAR NUEVA RESERVA (Escribir en BD)
    @PostMapping("/reservar-paquete")
    public String reservarPaqueteSubmit(@ModelAttribute FormularioReservaPaquete form,
                                        @RequestParam("email") String email,
                                        @RequestParam(value = "notas", required = false) String notas,
                                        // 🟢 NUEVO: Recibimos los días (por defecto 1 si falla)
                                        @RequestParam(value = "dias", defaultValue = "1") Integer dias,
                                        HttpSession session,
                                        RedirectAttributes redirectAttributes) {

        // 1. Verificar sesión
        Long usuarioId = (Long) session.getAttribute("usuarioId");
        if (usuarioId == null) {
            return "redirect:/";
        }

        // 2. Buscar al usuario
        Usuario usuario = usuarioRepositorio.findById(usuarioId).orElseThrow();

        // 3. Crear Reserva
        Reserva nuevaReserva = new Reserva();
        nuevaReserva.setUsuario(usuario);
        nuevaReserva.setPackageId(form.getPackageId());
        nuevaReserva.setFechaInicio(form.getFechaInicio());
        nuevaReserva.setPersonas(form.getPersonas());
        nuevaReserva.setEmailContacto(email);
        nuevaReserva.setNotas(notas);

        // 4. LÓGICA DE PRECIOS Y NOMBRES (Híbrida: Fijos vs Flexibles)
        String nombrePaquete = "Paquete EcoTravel";
        double precioBaseDiario = 100.0; // Valor por defecto

        // --- LIMA ---
        if (form.getPackageId().contains("LIMA")) {
            if (form.getPackageId().contains("HIST")) {
                // Paquete Fijo (Paquetes.html)
                nombrePaquete = "Lima: Ciudad de los Reyes";
                precioBaseDiario = 116.66; // ($350 / 3 días)
            } else {
                // Paquete Flexible (Index.html)
                nombrePaquete = "Experiencia Lima (Flexible)";
                precioBaseDiario = 85.0;
            }
        }
        // --- AREQUIPA ---
        else if (form.getPackageId().contains("AREQUIPA")) {
            if (form.getPackageId().contains("CAN")) {
                // Paquete Fijo
                nombrePaquete = "Arequipa: Cañón y Sillar";
                precioBaseDiario = 124.0; // ($620 / 5 días)
            } else {
                // Paquete Flexible
                nombrePaquete = "Experiencia Arequipa (Flexible)";
                precioBaseDiario = 90.0;
            }
        }
        // --- CUSCO ---
        else if (form.getPackageId().contains("CUSCO")) {
            if (form.getPackageId().contains("INKA")) {
                // Paquete Fijo
                nombrePaquete = "Cusco: Aventura Inka";
                precioBaseDiario = 157.14; // ($1100 / 7 días)
            } else {
                // Paquete Flexible
                nombrePaquete = "Experiencia Cusco (Flexible)";
                precioBaseDiario = 120.0;
            }
        }

        nuevaReserva.setNombrePaquete(nombrePaquete);

        // 5. CÁLCULO FINAL: Precio Diario * Días * Personas
        double totalCalculado = precioBaseDiario * dias * form.getPersonas();

        // Redondear a 2 decimales para que se vea bonito en la BD
        totalCalculado = Math.round(totalCalculado * 100.0) / 100.0;

        nuevaReserva.setPrecioTotal(totalCalculado);

        // 6. Guardar
        reservaRepositorio.save(nuevaReserva);

        redirectAttributes.addFlashAttribute("reservaExitosa", "¡Tu reserva para " + nombrePaquete + " ha sido confirmada!");

        return "redirect:/mis-reservas";
    }

    @GetMapping("/detalle-reserva/{id}")
    public String verDetalleReserva(@PathVariable Long id, HttpSession session, Model model) {

        // 1. Seguridad de sesión
        Long usuarioId = (Long) session.getAttribute("usuarioId");
        if (usuarioId == null) return "redirect:/";

        // 2. Buscar la reserva
        Reserva reserva = reservaRepositorio.findById(id).orElse(null);

        // Validación básica: que la reserva exista y pertenezca al usuario logueado
        if (reserva == null || !reserva.getUsuario().getId().equals(usuarioId)) {
            return "redirect:/mis-reservas";
        }

        // 3. LOGICA VISUAL: Determinar imágenes y textos según el PackageID
        String imagenCabecera = "/img/default.jpg";
        String descripcionLarga = "Disfruta de una experiencia inolvidable en Perú.";
        // Simulamos el itinerario (En un futuro podrías guardarlo en la BD)
        List<String> itinerario = new ArrayList<>();

        String pid = reserva.getPackageId(); // Atajo

        if (pid != null && pid.contains("LIMA")) {
            imagenCabecera = "/img/reserva-lima.jpg";
            descripcionLarga = "Lima, la Ciudad de los Reyes, te espera con su gastronomía de clase mundial, su historia colonial y la bohemia de Barranco.";
            itinerario.add("Día 1: Llegada al Aeropuerto Jorge Chávez y traslado a Miraflores.");
            itinerario.add("Día 2: Recorrido por el Centro Histórico y Catacumbas.");
            itinerario.add("Día 3: Visita a la Reserva de Lachay y despedida.");
        }
        else if (pid != null && pid.contains("AREQUIPA")) {
            imagenCabecera = "/img/reserva-arequipa.jpg";
            descripcionLarga = "La Ciudad Blanca te recibe con su arquitectura de sillar y la majestuosidad del Cañón del Colca.";
            itinerario.add("Día 1: Aclimatación y visita al Monasterio de Santa Catalina.");
            itinerario.add("Día 2: Ruta del Sillar y Canteras.");
            itinerario.add("Día 3: Viaje hacia el Valle del Colca (Chivay).");
            itinerario.add("Día 4: Mirador de la Cruz del Cóndor.");
            itinerario.add("Día 5: Retorno a la ciudad y traslado.");
        }
        else if (pid != null && pid.contains("CUSCO")) {
            imagenCabecera = "/img/reserva-cusco.jpg";
            descripcionLarga = "El ombligo del mundo. Historia Inca, energía mística y la maravilla de Machu Picchu.";
            itinerario.add("Día 1: Bienvenida con mate de coca y descanso.");
            itinerario.add("Día 2: City Tour: Sacsayhuamán y Qoricancha.");
            itinerario.add("Día 3: Valle Sagrado de los Incas (Pisac y Ollantaytambo).");
            itinerario.add("Día 4: Viaje en tren a Aguas Calientes.");
            itinerario.add("Día 5: ¡Machu Picchu! Recorrido guiado.");
            itinerario.add("Día 6: Día libre en Cusco (Mercado San Pedro).");
            itinerario.add("Día 7: Traslado al aeropuerto.");
        }

        // 4. Pasar todo al modelo
        model.addAttribute("reserva", reserva);
        model.addAttribute("imagenCabecera", imagenCabecera);
        model.addAttribute("descripcion", descripcionLarga);
        model.addAttribute("itinerario", itinerario);

        // Para el header
        if (!model.containsAttribute("formularioRegistro")) {
            model.addAttribute("formularioRegistro", new FormularioRegistro());
        }

        return "detalle-reserva";
    }

    @GetMapping("/cancelar-reserva/{id}")
    public String cancelarReserva(@PathVariable Long id, HttpSession session, RedirectAttributes redirectAttributes) {

        Long usuarioId = (Long) session.getAttribute("usuarioId");
        if (usuarioId == null) return "redirect:/";

        // 1. Buscar la reserva
        Reserva reserva = reservaRepositorio.findById(id).orElse(null);

        // 2. Validaciones de seguridad
        // - Que la reserva exista
        // - Que la reserva pertenezca al usuario que está logueado (¡Muy importante!)
        // - Que no esté ya cancelada
        if (reserva != null && reserva.getUsuario().getId().equals(usuarioId) && !reserva.getEstado().equals("cancelada")) {

            // 3. Cambiar estado
            reserva.setEstado("cancelada");

            // 4. Guardar cambio
            reservaRepositorio.save(reserva);

            redirectAttributes.addFlashAttribute("reservaExitosa", "La reserva #" + id + " ha sido cancelada correctamente.");
        } else {
            redirectAttributes.addFlashAttribute("error", "No se pudo cancelar la reserva o ya estaba cancelada.");
        }

        return "redirect:/mis-reservas";
    }

    // ==========================================
    // 5. MÉTODOS AUXILIARES
    // ==========================================

    // Helper para no repetir código: asegura que el modal de registro funcione en todas las páginas
    private void agregarFormularioSiNoExiste(Model model) {
        if (!model.containsAttribute("formularioRegistro")) {
            model.addAttribute("formularioRegistro", new FormularioRegistro());
        }
    }
}