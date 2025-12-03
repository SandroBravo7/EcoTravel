package com.proyecto.EcoTravel.Repositorios;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.proyecto.EcoTravel.modelos.Reserva;
import com.proyecto.EcoTravel.modelos.Usuario;

@Repository
public interface ReservaRepositorio extends JpaRepository<Reserva, Long> {

    // Obtener todas las reservas de un usuario
    List<Reserva> findByUsuario(Usuario usuario);

    // Obtener reservas de un usuario ordenadas por fecha de reserva descendente
    List<Reserva> findByUsuarioOrderByFechaReservaDesc(Usuario usuario);

    // Obtener reservas de un usuario por estado
    List<Reserva> findByUsuarioAndEstado(Usuario usuario, String estado);
}
