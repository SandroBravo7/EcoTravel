package com.proyecto.EcoTravel.Controladores;

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
                              HttpSession sesion,
                              Model model,
                              RedirectAttributes redirectAttributes) {
        boolean ok = usuarioServicio.autenticar(email, contraseña);
        if (!ok) {
            model.addAttribute("logueoError", "Correo o contraseña incorrectos");
            return "index";
        }

        usuarioServicio.findByEmail(email).ifPresent(u -> {
            sesion.setAttribute("usuarioId", u.getId());
            sesion.setAttribute("usuarioName", u.getNombre());
        });
        return "redirect:/";
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
    public String mostrarMapa() {
        return "mapa";
    }    
}
