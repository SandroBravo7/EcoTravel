package com.proyecto.EcoTravel.DTOs;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class FormularioReservaPaquete {

    // Campo oculto del paquete seleccionado (viene de la tarjeta)
    @NotBlank(message = "El ID del paquete no puede estar vacío.")
    private String packageId;

    @NotBlank(message = "El nombre es obligatorio.")
    private String nombre;

    @NotBlank(message = "El email es obligatorio.")
    @Email(message = "Formato de email incorrecto.")
    private String email;

    @NotBlank(message = "La fecha de inicio es obligatoria.")
    private String fechaInicio; // Usamos String, asumiendo que Spring lo validará después o en el servicio.

    @NotNull(message = "El número de personas es obligatorio.")
    @Min(value = 1, message = "Debe haber al menos una persona.")
    private Integer personas;

    private String nombrePaquete;
    private Double precioUnitario;
    private String detallesViaje;

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

    public String getFechaInicio() {
        return fechaInicio;
    }

    public void setFechaInicio(String fechaInicio) {
        this.fechaInicio = fechaInicio;
    }

    public Integer getPersonas() {
        return personas;
    }

    public void setPersonas(Integer personas) {
        this.personas = personas;
    }

    public String getNombrePaquete() {
        return nombrePaquete;
    }

    public void setNombrePaquete(String nombrePaquete) {
        this.nombrePaquete = nombrePaquete;
    }

    public Double getPrecioUnitario() {
        return precioUnitario;
    }

    public void setPrecioUnitario(Double precioUnitario) {
        this.precioUnitario = precioUnitario;
    }

    public String getDetallesViaje() {
        return detallesViaje;
    }

    public void setDetallesViaje(String detallesViaje) {
        this.detallesViaje = detallesViaje;
    }
}
