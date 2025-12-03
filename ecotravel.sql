/*Creación de la base de datos*/
CREATE DATABASE ecotravel;
USE ecotravel;

/*Creación de la tabla 'usuario*/
CREATE TABLE usuario (
    id BIGINT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    fecha_nacimiento DATE NOT NULL,
    contraseña_hash VARCHAR(255) NOT NULL,
    PRIMARY KEY (id)
);

/*Mostrar la estructura de la tabla*/
DESCRIBE usuario;

/*Consultar todos los registros de la tabla*/
SELECT * FROM usuario;

/*Eliminar la tabla si es necesario*/
DROP TABLE usuario;

/*Creación de la tabla 'reserva'*/
CREATE TABLE reserva (
    id BIGINT NOT NULL AUTO_INCREMENT,
    usuario_id BIGINT NOT NULL,
    nombre_paquete VARCHAR(255) NOT NULL,
    fecha_reserva DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_inicio DATE NOT NULL,
    numero_personas INT NOT NULL,
    precio_total DECIMAL(10, 2) NOT NULL,
    estado VARCHAR(50) DEFAULT 'pendiente',
    detalles_viaje LONGTEXT,
    PRIMARY KEY (id),
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
);
