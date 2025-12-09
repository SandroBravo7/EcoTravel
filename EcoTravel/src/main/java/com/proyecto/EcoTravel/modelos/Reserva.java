package com.proyecto.EcoTravel.modelos;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "reservas")
public class Reserva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relación con tu Usuario (que también está en 'modelos')
    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    private String packageId; // ID interno (ej. LIMA_HIST_01)
    private String nombrePaquete;
    private String emailContacto; // Guardamos el correo que puso en el formulario

    private LocalDate fechaInicio;
    private Integer personas;
    private Double precioTotal;

    @Column(columnDefinition = "TEXT")
    private String notas; // Para las notas especiales del formulario

    private LocalDateTime fechaReserva;
    private String estado; // "confirmada", "cancelada"

    @PrePersist
    protected void onCreate() {
        this.fechaReserva = LocalDateTime.now();
        this.estado = "confirmada";
    }

    // --- CONSTRUCTORES, GETTERS Y SETTERS ---

    public Reserva() {}

    // Getters y Setters básicos (Generálos con tu IDE o copia estos)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }

    public String getPackageId() { return packageId; }
    public void setPackageId(String packageId) { this.packageId = packageId; }

    public String getNombrePaquete() { return nombrePaquete; }
    public void setNombrePaquete(String nombrePaquete) { this.nombrePaquete = nombrePaquete; }

    public String getEmailContacto() { return emailContacto; }
    public void setEmailContacto(String emailContacto) { this.emailContacto = emailContacto; }

    public LocalDate getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(LocalDate fechaInicio) { this.fechaInicio = fechaInicio; }

    public Integer getNumeroPersonas() { return personas; } // Ojo: en html usas th:text="${reserva.numeroPersonas}" si el getter se llama así
    public void setPersonas(Integer personas) { this.personas = personas; }

    public Double getPrecioTotal() { return precioTotal; }
    public void setPrecioTotal(Double precioTotal) { this.precioTotal = precioTotal; }

    public String getNotas() { return notas; }
    public void setNotas(String notas) { this.notas = notas; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public LocalDateTime getFechaReserva() { return fechaReserva; }
}