from sqlalchemy import Table, Column, Integer, ForeignKey
from src.models.base import Base, db

usuario_servicio = Table(
    'usuario_servicio', db.metadata,
    Column('usuario_id', Integer, ForeignKey('usuario.id_usuario'), primary_key=True),
    Column('servicio_id', Integer, ForeignKey('servicio.id_servicio'), primary_key=True)
)