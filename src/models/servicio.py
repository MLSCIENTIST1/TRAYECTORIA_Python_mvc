from sqlalchemy import Column, Integer, String
from . import Base


class Servicio(Base):
    __tablename__="servicio"
    id_servicio = Column(Integer, )
    nombre_servicio = Column(Integer, Nullable = False)
    fecha_inicio = Column(Date, Nullable = False)
    fecha_fin = Column(Date, Nullable = False)
    nombre_contratante =Column (String, Nullable = False)
