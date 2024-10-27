from sqlalchemy import Column, Integer, String, ForeignKey
from src.models.base import Base  # Importar Base desde base.py
from sqlalchemy.orm import relationship

class Calificacion(Base):
    __tablename__ = "calificacion"
    id_calificacion = Column(Integer, primary_key=True)
    puntaje_por_labor = Column(Integer, nullable=False)
    puntaje_global = Column(Integer, nullable=False)
    comentario = Column(String, nullable=True)

###Clave foranea hacia servicio

    id_servicio = Column(Integer, ForeignKey('servicio.id_servicio'))
    servicio = relationship("Servicio", back_populates="calificaciones")



###Clave foranea hacia usuarios
    id_usuario = Column(Integer, ForeignKey('usuario.id_usuario'))
    usuarios = relationship("Usuario", back_populates="calificaciones")