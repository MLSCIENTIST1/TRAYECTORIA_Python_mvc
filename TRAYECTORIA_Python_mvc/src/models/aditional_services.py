from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from src.models.database import db

class AditionalService(db.Model):
    __tablename__ = "aditional_services"

    id_service = Column(Integer, primary_key=True)
    id_usuario = Column(Integer, ForeignKey('usuario.id_usuario'), nullable=False)
    fecha_creacion = Column(DateTime, default=datetime.utcnow, nullable=False)
    nombre_servicio = Column(String(255), nullable=False)
    descripcion = Column(String(500), nullable=True)
    estado = Column(String(50), default="activo", nullable=True)
    precio = Column(Float, nullable=True)
    categoria = Column(String(100), nullable=True)
    fecha_modificacion = Column(DateTime, onupdate=datetime.utcnow, nullable=True)

   

    def __init__(self, id_usuario, nombre_servicio, descripcion=None, precio=None, categoria=None):
        self.id_usuario = id_usuario
        self.nombre_servicio = nombre_servicio
        self.descripcion = descripcion
        self.precio = precio
        self.categoria = categoria
        self.fecha_creacion = datetime.utcnow()

    # CRUD
    @classmethod
    def leer(cls, session, id_service):
        return session.query(cls).filter_by(id_service=id_service).first()

    def actualizar(self, session, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)
        session.commit()

    @classmethod
    def eliminar(cls, session, id_service):
        service = cls.leer(session, id_service)
        if service:
            session.delete(service)
            session.commit()