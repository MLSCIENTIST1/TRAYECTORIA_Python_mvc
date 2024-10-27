from sqlalchemy import Column, Integer, ForeignKey
from src.models.base import Base

class UsuarioServicio(Base):
    __tablename__= "usuario_servicio"
    usuario_id = Column (Integer, ForeignKey('usuario.id_usuario' ), primary_key=True)
    servicio_id = Column(Integer, ForeignKey('servicio.id_servicio'), primary_key=True)