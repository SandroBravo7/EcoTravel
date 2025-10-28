package com.proyecto.EcoTravel.DTOs;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class FormularioRegistro {

    @NotBlank
    private String nombre;

    @NotBlank
    private String apellido;

    @NotBlank
    private String email;

    @NotBlank
    private String fechaNacimiento;

    @NotBlank
    @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
    private String contraseña;

    @NotBlank
    private String confirmarContraseña;

    public String getNombre() { 
        return nombre; 
    }

    public void setNombre(String nombre) { 
        this.nombre = nombre; 
    }

    public String getApellido() { 
        return apellido; 
    }

    public void setApellido(String apellido) { 
        this.apellido = apellido; 
    }

    public String getEmail() { 
        return email; 
    }

    public void setEmail(String email) { 
        this.email = email; 
    }

    public String getFechaNacimiento() { 
        return fechaNacimiento; 
    }

    public void setFechaNacimiento(String fechaNacimiento) { 
        this.fechaNacimiento = fechaNacimiento; 
    }

    public String getContraseña() { 
        return contraseña; 
    }

    public void setContraseña(String contraseña) { 
        this.contraseña = contraseña;
    }

    public String getConfirmarContraseña() { 
        return confirmarContraseña;
    }

    public void setConfirmarContraseña(String confirmarContraseña) { 
        this.confirmarContraseña = confirmarContraseña; 
    }
}