package com.proyecto.EcoTravel.Servicios;

import java.time.LocalDate;
import java.util.Optional;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.proyecto.EcoTravel.DTOs.FormularioRegistro;
import com.proyecto.EcoTravel.Repositorios.UsuarioRepositorio;
import com.proyecto.EcoTravel.modelos.Usuario;


@Service
public class UsuarioServicio {
    
    private final UsuarioRepositorio usuarioRepositorio;
    
    public UsuarioServicio(UsuarioRepositorio usuarioRepositorio) {
        this.usuarioRepositorio = usuarioRepositorio;
    }

    public Optional<Usuario> findByEmail(String email) {
        return usuarioRepositorio.findByEmail(email);
    }
    
    public boolean existsByEmail(String email) {
        return usuarioRepositorio.existsByEmail(email);
    }

    @Transactional
    public Usuario registrarNuevoUsuario(FormularioRegistro form) {
        if (!form.getContraseña().equals(form.getConfirmarContraseña())) {
            throw new IllegalArgumentException("Las contraseñas no coinciden");
        }
        if (existsByEmail(form.getEmail())) {
            throw new IllegalArgumentException("El correo ya está registrado");
        }

        if (form.getFechaNacimiento() == null) {
            throw new IllegalArgumentException("Debe ingresar una fecha de nacimiento válida");
        }

        Usuario u = new Usuario();
        u.setNombre(form.getNombre());
        u.setApellido(form.getApellido());
        u.setEmail(form.getEmail());
        try {
            LocalDate fecha = LocalDate.parse(form.getFechaNacimiento());
            u.setFechaNacimiento(fecha);
        } catch (Exception e) {
            throw new IllegalArgumentException("Formato de fecha inválido. Use AAAA-MM-DD");
        }
        String hashed = BCrypt.hashpw(form.getContraseña(), BCrypt.gensalt(12));
        u.setContraseñaHash(hashed);
        return usuarioRepositorio.save(u);
    }

    public boolean autenticar(String email, String rawContraseña) {
        Optional<Usuario> ou = usuarioRepositorio.findByEmail(email);
        if (ou.isEmpty()) return false;
        Usuario user = ou.get();
        return BCrypt.checkpw(rawContraseña, user.getContraseñaHash());
    }

}
