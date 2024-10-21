from sqlalchemy import Column, Integer, String
from . import Base

class Usuario(Base):
    __tablename__ = "usuario"
    
    id_usuario = Column(Integer, primary_key=True)
    nombre = Column(String, nullable=False)
    apellidos = Column(String, nullable=False)
    correo = Column(String, nullable=False)
    contraseña = Column(String, nullable=False)
    labor = Column(String, nullable=False)
    cedula = Column(Integer, nullable=False)