package com.proyecto.EcoTravel.Servicios;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.proyecto.EcoTravel.DTOs.FormularioReservaPaquete;
import com.proyecto.EcoTravel.Repositorios.ReservaRepositorio;
import com.proyecto.EcoTravel.Repositorios.UsuarioRepositorio;
import com.proyecto.EcoTravel.modelos.Reserva;
import com.proyecto.EcoTravel.modelos.Usuario;

@Service
public class ReservaServicio {

    private final ReservaRepositorio reservaRepositorio;
    private final UsuarioRepositorio usuarioRepositorio;

    public ReservaServicio(ReservaRepositorio reservaRepositorio, UsuarioRepositorio usuarioRepositorio) {
        this.reservaRepositorio = reservaRepositorio;
        this.usuarioRepositorio = usuarioRepositorio;
    }

    /**
     * Guardar una nueva reserva
     */
    public Reserva guardarReserva(FormularioReservaPaquete formulario, Long usuarioId) {
        Usuario usuario = usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        Reserva reserva = new Reserva();
        reserva.setUsuario(usuario);
        reserva.setNombrePaquete(formulario.getNombrePaquete());
        reserva.setNumeroPersonas(formulario.getPersonas());

        // Parsear fecha del formulario (asumiendo formato "YYYY-MM-DD")
        try {
            LocalDate fechaInicio = LocalDate.parse(formulario.getFechaInicio(), DateTimeFormatter.ISO_LOCAL_DATE);
            reserva.setFechaInicio(fechaInicio);
        } catch (Exception e) {
            throw new IllegalArgumentException("Formato de fecha inválido");
        }

        // Calcular precio total (precio por persona * número de personas)
        BigDecimal precioUnitario = formulario.getPrecioUnitario() != null
                ? BigDecimal.valueOf(formulario.getPrecioUnitario())
                : BigDecimal.ZERO;

        BigDecimal precioTotal = precioUnitario.multiply(BigDecimal.valueOf(formulario.getPersonas()));
        reserva.setPrecioTotal(precioTotal);

        reserva.setDetallesViaje(formulario.getDetallesViaje());
        reserva.setEstado("pendiente");

        return reservaRepositorio.save(reserva);
    }

    /**
     * Obtener todas las reservas de un usuario
     */
    public List<Reserva> obtenerReservasPorUsuario(Long usuarioId) {
        Usuario usuario = usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        return reservaRepositorio.findByUsuarioOrderByFechaReservaDesc(usuario);
    }

    /**
     * Obtener una reserva por ID
     */
    public Optional<Reserva> obtenerReservaPorId(Long reservaId) {
        return reservaRepositorio.findById(reservaId);
    }

    /**
     * Actualizar estado de una reserva
     */
    public Reserva actualizarEstadoReserva(Long reservaId, String nuevoEstado) {
        Reserva reserva = reservaRepositorio.findById(reservaId)
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada"));

        reserva.setEstado(nuevoEstado);
        return reservaRepositorio.save(reserva);
    }

    /**
     * Eliminar una reserva
     */
    public void eliminarReserva(Long reservaId) {
        if (!reservaRepositorio.existsById(reservaId)) {
            throw new IllegalArgumentException("Reserva no encontrada");
        }
        reservaRepositorio.deleteById(reservaId);
    }
}
