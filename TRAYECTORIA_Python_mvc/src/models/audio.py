from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from src.models.database import db

class Audio(db.Model):
    __tablename__ = "audio"

    id_audio = Column(Integer, primary_key=True)
    url = Column(String, nullable=False)  # Ruta de almacenamiento del audio
    etapa_id = Column(Integer, ForeignKey('etapa.id_etapa'), nullable=False)

    # Relación con Etapa
    etapa = relationship("Etapa", back_populates="audios")