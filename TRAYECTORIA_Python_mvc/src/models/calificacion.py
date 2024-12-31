from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from src.models.database import db

class Calificacion(db.Model):
    """Modelo de calificación para un servicio."""

    __tablename__ = "calificacion"

    id_calificacion = Column(Integer, primary_key=True)
    puntaje_por_labor = Column(Integer, nullable=False)
    puntaje_global = Column(Integer, nullable=False)
    comentario = Column(String, nullable=True)

    calificaciones = relationship("Calificacion", back_populates="usuario")  # Relación con Calificacion
    servicios = relationship("Servicio", secondary="usuario_servicio", back_populates="usuarios")  # Relación con Servicio

    
    def __init__(self, nombre, apellidos, correo, contrasenia, labor, cedula, celular, ciudad):
        self.nombre = nombre
        self.apellidos = apellidos
        self.correo = correo
        self.set_password(contrasenia)  # Usar el método set_password para almacenar el hash
        self.labor = labor
        self.cedula = cedula
        self.celular = celular
        self.ciudad = ciudad

    def actualizar(self, puntaje_por_labor=None, puntaje_global=None, comentario=None):
        """Actualiza los atributos de una calificación."""
        if puntaje_por_labor is not None:
            self.puntaje_por_labor = puntaje_por_labor
        if puntaje_global is not None:
            self.puntaje_global = puntaje_global
        if comentario is not None:
            self.comentario = comentario

    @classmethod
    def leer(cls, session, id_calificacion):
        """Lee una calificación por su ID."""
        return session.query(cls).filter_by(id_calificacion=id_calificacion).first()

    @classmethod
    def eliminar(cls, session, id_calificacion):
        """Elimina una calificación por su ID."""
        calificacion = cls.leer(session, id_calificacion)
        if calificacion:
            session.delete(calificacion)
            session.commit()