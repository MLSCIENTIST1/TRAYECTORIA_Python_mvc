from sqlalchemy import Column, Integer, String, Date
from sqlalchemy.orm import relationship
from src.models.base import Base, db
from src.models.usuario_servicio import usuario_servicio

class Servicio(db.Model):
    """Modelo de un servicio."""

    __tablename__ = "servicio"

    id_servicio = Column(Integer, primary_key=True)
    nombre_servicio = Column(String, nullable=False)
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=False)
    nombre_contratante = Column(String, nullable=False)

    usuarios = relationship("Usuario", secondary=usuario_servicio, back_populates="servicios")
    calificaciones = relationship("Calificacion", back_populates="servicio")

    def __init__(self, nombre_servicio, fecha_inicio, fecha_fin, nombre_contratante, session=None):
        """Constructor de la clase Servicio."""
        self.nombre_servicio = nombre_servicio
        self.fecha_inicio = fecha_inicio
        self.fecha_fin = fecha_fin
        self.nombre_contratante = nombre_contratante
        if session:
            session.add(self)
            session.commit()

    def actualizar(self, session, nombre_servicio=None, fecha_inicio=None, fecha_fin=None, nombre_contratante=None):
        """Actualiza los atributos de un servicio."""
        if nombre_servicio:
            self.nombre_servicio = nombre_servicio
        # ... (resto de actualizaciones)
        session.commit()

    @classmethod
    def leer(cls, session, id_servicio):
        """Lee un servicio por su ID."""
        return session.query(cls).filter_by(id_servicio=id_servicio).first()

    @classmethod
    def eliminar(cls, session, id_servicio):
        """Elimina un servicio por su ID."""
        servicio = cls.leer(session, id_servicio)
        if servicio:
            session.delete(servicio)
            session.commit()