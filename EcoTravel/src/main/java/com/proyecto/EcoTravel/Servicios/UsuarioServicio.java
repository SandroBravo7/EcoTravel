package com.proyecto.EcoTravel.Servicios;

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
        // 1. Validaciones lógicas
        if (!form.getContraseña().equals(form.getConfirmarContraseña())) {
            throw new IllegalArgumentException("Las contraseñas no coinciden");
        }
        if (existsByEmail(form.getEmail())) {
            throw new IllegalArgumentException("El correo ya está registrado");
        }
        // Nota: La validación de fecha null ya la hace el @NotNull del DTO antes de llegar aquí

        // 2. Crear Usuario
        Usuario u = new Usuario();
        u.setNombre(form.getNombre());
        u.setApellido(form.getApellido());
        u.setEmail(form.getEmail());

        // 🛑 CAMBIO: Asignación directa (Ya no necesitamos try-catch ni parse)
        u.setFechaNacimiento(form.getFechaNacimiento());

        // 3. Encriptar contraseña
        String hashed = BCrypt.hashpw(form.getContraseña(), BCrypt.gensalt(12));
        u.setContraseñaHash(hashed);

        // 4. Guardar
        return usuarioRepositorio.save(u);
    }

    public boolean autenticar(String email, String rawContraseña) {
        Optional<Usuario> ou = usuarioRepositorio.findByEmail(email);
        if (ou.isEmpty()) return false;
        Usuario user = ou.get();
        return BCrypt.checkpw(rawContraseña, user.getContraseñaHash());
    }

}