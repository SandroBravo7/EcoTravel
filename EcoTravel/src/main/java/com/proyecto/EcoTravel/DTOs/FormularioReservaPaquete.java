package com.proyecto.EcoTravel.DTOs;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Email;
import org.springframework.format.annotation.DateTimeFormat; // 🟢 Importante para convertir HTML a Java
import java.time.LocalDate; // 🟢 Usamos el tipo de dato correcto

public class FormularioReservaPaquete {

    // Campo oculto del paquete seleccionado
    @NotBlank(message = "El ID del paquete no puede estar vacío.")
    private String packageId;

    @NotBlank(message = "El nombre es obligatorio.")
    private String nombre;

    @NotBlank(message = "El email es obligatorio.")
    @Email(message = "Formato de email incorrecto.")
    private String email;

    // 🛑 CAMBIO CLAVE: Usamos LocalDate y @DateTimeFormat
    // @NotBlank solo sirve para Strings, para objetos usamos @NotNull
    @NotNull(message = "La fecha de inicio es obligatoria.")
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private LocalDate fechaInicio;

    @NotNull(message = "El número de personas es obligatorio.")
    @Min(value = 1, message = "Debe haber al menos una persona.")
    private Integer personas;

    // --- Getters y Setters ---

    public String getPackageId() {
        return packageId;
    }

    public void setPackageId(String packageId) {
        this.packageId = packageId;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    // 🟢 Getter y Setter actualizados a LocalDate
    public LocalDate getFechaInicio() {
        return fechaInicio;
    }

    public void setFechaInicio(LocalDate fechaInicio) {
        this.fechaInicio = fechaInicio;
    }

    public Integer getPersonas() {
        return personas;
    }

    public void setPersonas(Integer personas) {
        this.personas = personas;
    }
}