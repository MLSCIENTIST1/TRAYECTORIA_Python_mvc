from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from src.models.usuario_servicio import usuario_servicio  # Se importa la tabla intermedia
from src.models.database import db

class Servicio(db.Model):
    __tablename__ = "servicio"

    # Definición de columnas
    id_servicio = Column(Integer, primary_key=True)
    nombre_servicio = Column(String, nullable=False)
    fecha_solicitud = Column(Date, nullable=False)
    fecha_aceptacion = Column(Date, nullable=False)
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=False)
    nombre_contratante = Column(String, nullable=False)
    id_contratante = Column(Integer, ForeignKey('usuario.id_usuario'), nullable=False)

    # Relación con usuarios
    usuarios = relationship("Usuario", secondary=usuario_servicio, back_populates="servicios")

    def __init__(self, nombre_servicio, fecha_solicitud, fecha_aceptacion, fecha_inicio, fecha_fin, nombre_contratante, id_contratante):
        self.nombre_servicio = nombre_servicio
        self.fecha_solicitud = fecha_solicitud
        self.fecha_aceptacion = fecha_aceptacion
        self.fecha_inicio = fecha_inicio
        self.fecha_fin = fecha_fin
        self.nombre_contratante = nombre_contratante
        self.id_contratante = id_contratante

    # CRUD
    @classmethod
    def leer(cls, session, id_servicio):
        return session.query(cls).filter_by(id_servicio=id_servicio).first()

    def actualizar(self, session, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)
        session.commit()

    @classmethod
    def eliminar(cls, session, id_servicio):
        servicio = cls.leer(session, id_servicio)
        if servicio:
            session.delete(servicio)
            session.commit()