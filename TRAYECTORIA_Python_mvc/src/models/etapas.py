from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from src.models.database import db

class Etapa(db.Model):
    __tablename__ = "etapa"

    id_etapa = Column(Integer, primary_key=True)
    nombre = Column(String, nullable=False)  # Ejemplo: "Inicial", "Media", "Final"
    servicio_id = Column(Integer, ForeignKey('servicio.id_servicio'), nullable=False)

    # Relación con Servicio
    servicio = relationship("Servicio", back_populates="etapas")

    # Relación con recursos multimedia
    fotos = relationship("Foto", back_populates="etapa", cascade="all, delete-orphan")
    audios = relationship("Audio", back_populates="etapa", cascade="all, delete-orphan")
    videos = relationship("Video", back_populates="etapa", cascade="all, delete-orphan")