package com.proyecto.EcoTravel.modelos;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "reserva")
public class Reserva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @NotBlank
    @Column(name = "nombre_paquete", nullable = false)
    private String nombrePaquete;

    @Column(name = "fecha_reserva", nullable = false, updatable = false)
    private LocalDateTime fechaReserva = LocalDateTime.now();

    @NotNull
    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;

    @NotNull
    @Min(1)
    @Column(name = "numero_personas", nullable = false)
    private Integer numeroPersonas;

    @NotNull
    @Column(name = "precio_total", precision = 10, scale = 2, nullable = false)
    private BigDecimal precioTotal;

    @Column(length = 50)
    private String estado = "pendiente";

    @Column(name = "detalles_viaje", columnDefinition = "LONGTEXT")
    private String detallesViaje;

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }

    public String getNombrePaquete() { return nombrePaquete; }
    public void setNombrePaquete(String nombrePaquete) { this.nombrePaquete = nombrePaquete; }

    public LocalDateTime getFechaReserva() { return fechaReserva; }
    public void setFechaReserva(LocalDateTime fechaReserva) { this.fechaReserva = fechaReserva; }

    public LocalDate getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(LocalDate fechaInicio) { this.fechaInicio = fechaInicio; }

    public Integer getNumeroPersonas() { return numeroPersonas; }
    public void setNumeroPersonas(Integer numeroPersonas) { this.numeroPersonas = numeroPersonas; }

    public BigDecimal getPrecioTotal() { return precioTotal; }
    public void setPrecioTotal(BigDecimal precioTotal) { this.precioTotal = precioTotal; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public String getDetallesViaje() { return detallesViaje; }
    public void setDetallesViaje(String detallesViaje) { this.detallesViaje = detallesViaje; }
}
