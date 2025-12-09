package com.proyecto.EcoTravel.Repositorios;

import com.proyecto.EcoTravel.modelos.Reserva; // Importamos desde 'modelos'
import com.proyecto.EcoTravel.modelos.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReservaRepositorio extends JpaRepository<Reserva, Long> {
    // Buscar todas las reservas de un usuario
    List<Reserva> findByUsuario(Usuario usuario);
}