from sqlalchemy import Column, Integer, String
from src.models.base import Base  # Importar Base desde base.py

class Calificacion(Base):
    __tablename__ = "calificacion"
    id_calificacion = Column(Integer, primary_key=True)
    puntaje_por_labor = Column(Integer, nullable=False)
    puntaje_global = Column(Integer, nullable=False)
    comentario = Column(String, nullable=True)