from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from src.models.database import db

class Video(db.Model):
    __tablename__ = "video"

    id_video = Column(Integer, primary_key=True)
    url = Column(String, nullable=False)  # Ruta de almacenamiento del video
    etapa_id = Column(Integer, ForeignKey('etapa.id_etapa'), nullable=False)

    # Relación con Etapa
    etapa = relationship("Etapa", back_populates="videos")