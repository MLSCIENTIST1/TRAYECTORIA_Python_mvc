from sqlalchemy import Column, Integer, String, Date
from sqlalchemy.orm import Relationship
from . import Base


class Servicio(Base):
    __tablename__="servicio"
    id_servicio = Column(Integer,primary_key= True )
    nombre_servicio = Column(Integer, nullable = False)
    fecha_inicio = Column(Date, nullable = False)
    fecha_fin = Column(Date, nullable = False)
    nombre_contratante =Column (String, nullable = False)

    usuarios = Relationship("Usuario", secondary="usuario_servicio", back_populates="servicios")
    calificaciones = Relationship("Calificacion", back_populates="servicio")
