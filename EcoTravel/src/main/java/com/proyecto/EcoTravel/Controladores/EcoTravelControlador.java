package com.proyecto.EcoTravel.Controladores;

import com.proyecto.EcoTravel.DTOs.FormularioReservaPaquete;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import com.proyecto.EcoTravel.DTOs.FormularioRegistro;
import com.proyecto.EcoTravel.Servicios.UsuarioServicio;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;

@Controller
public class EcoTravelControlador {
    
    private final UsuarioServicio usuarioServicio;

    public EcoTravelControlador(UsuarioServicio usuarioServicio) {
        this.usuarioServicio = usuarioServicio;
    }

    @PostMapping("/registrarse")
    public String registroSubmit( @Valid @ModelAttribute FormularioRegistro form, 
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
                              // 🛑 ACEPTA el nuevo parámetro desde el formulario
                              @RequestParam(value = "redirectUrl", required = false) String redirectUrl,
                              HttpSession sesion,
                              Model model,
                              RedirectAttributes redirectAttributes) {

        boolean ok = usuarioServicio.autenticar(email, contraseña);
        if (!ok) {
            model.addAttribute("logueoError", "Correo o contraseña incorrectos");
            // Nota: Aquí lo ideal sería mantener la URL de redirección en el modelo
            // para que si falla el login, el campo oculto no se pierda.
            return "index"; // Esto podría llevar al index si el login falla en otra página
        }

        usuarioServicio.findByEmail(email).ifPresent(u -> {
            sesion.setAttribute("usuarioId", u.getId());
            sesion.setAttribute("usuarioName", u.getNombre());
        });

        // 🛑 Lógica para usar la URL recibida
        if (redirectUrl != null && !redirectUrl.isEmpty()) {
            return "redirect:" + redirectUrl;
        }

        // Fallback si por alguna razón no se capturó la URL
        return "redirect:/index";
    }

    @GetMapping("/desloguearse")
    public String logout(HttpSession sesion) {
        sesion.invalidate();
        return "redirect:/";
    }

    @GetMapping({"/", "/index"})
    public String mostrarInicio(Model model) {
        if (!model.containsAttribute("formularioRegistro")) {
            model.addAttribute("formularioRegistro", new FormularioRegistro());
        }
        return "index";
    }

    @GetMapping("/mapa")
    public String mostrarMapa(Model model) { // 1. Añadimos el objeto Model
        // 2. Añadimos el formularioRegistro al modelo para que los modales funcionen
        if (!model.containsAttribute("formularioRegistro")) {
            model.addAttribute("formularioRegistro", new FormularioRegistro());
        }
        return "mapa";
    }

    // Método para mostrar la página de Paquetes (NUEVO)
    @GetMapping("/paquetes")
    public String mostrarPaquetes(Model model) {
        if (!model.containsAttribute("formularioRegistro")) {
            model.addAttribute("formularioRegistro", new FormularioRegistro());
        }
        // Aquí podrías añadir los paquetes al modelo si fueran dinámicos
        return "paquetes";
    }

    // Método para mostrar la página "Acerca de Nosotros"
    @GetMapping("/acerca")
    public String mostrarAcercaDeNosotros(Model model) {
        // Es CRUCIAL añadir el formularioRegistro al modelo para que los modales
        // de iniciar sesión y registro funcionen en esta página también.
        if (!model.containsAttribute("formularioRegistro")) {
            model.addAttribute("formularioRegistro", new FormularioRegistro());
        }

        // Spring buscará la plantilla 'acerca.html' en la carpeta 'templates'
        return "acerca";
    }

    // Método para manejar el envío del formulario de reserva (NUEVO)
    @PostMapping("/reservar-paquete")
    public String reservarPaqueteSubmit(@ModelAttribute FormularioReservaPaquete form,
                                        RedirectAttributes redirectAttributes) {

        // **Falta la lógica real de tu servicio para guardar la reserva**
        System.out.println("Reserva recibida para el paquete ID: " + form.getPackageId() + " por " + form.getNombre());

        redirectAttributes.addFlashAttribute("reservaExitosa", "¡Reserva confirmada! Te contactaremos pronto.");

        return "redirect:/paquetes";
    }
}
