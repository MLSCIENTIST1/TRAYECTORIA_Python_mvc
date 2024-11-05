from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from src.models.base import Base, db

class Calificacion(db.Model):
    """Modelo de calificación para un servicio."""

    __tablename__ = "calificacion"

    id_calificacion = Column(Integer, primary_key=True)
    puntaje_por_labor = Column(Integer, nullable=False)
    puntaje_global = Column(Integer, nullable=False)
    comentario = Column(String, nullable=True)

    # Relaciones
    id_servicio = Column(Integer, ForeignKey('servicio.id_servicio'))
    servicio = relationship("Servicio", back_populates="calificaciones")

    id_usuario = Column(Integer, ForeignKey('usuario.id_usuario'))
    usuario = relationship("Usuario", back_populates="calificaciones")

    def __init__(self, puntaje_por_labor, puntaje_global, comentario, id_servicio, id_usuario):
        """Constructor de la clase Calificacion."""
        self.puntaje_por_labor = puntaje_por_labor
        self.puntaje_global = puntaje_global
        self.comentario = comentario
        self.id_servicio = id_servicio
        self.id_usuario = id_usuario

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