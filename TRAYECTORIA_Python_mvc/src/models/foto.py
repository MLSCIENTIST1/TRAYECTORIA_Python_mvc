from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from src.models.database import db



class Foto(db.Model):
    __tablename__ = "foto"

    id_foto = Column(Integer, primary_key=True)
    url = Column(String, nullable=False)  # Ruta de almacenamiento de la foto
    etapa_id = Column(Integer, ForeignKey('etapa.id_etapa'), nullable=False)

    # Relación con Etapa
    etapa = relationship("Etapa", back_populates="fotos")