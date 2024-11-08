 #Importaciones necesarias
from sqlalchemy import Table, Column, Integer, ForeignKey
from src.models.database import db

# Definición de la tabla intermedia `usuario_servicio`
usuario_servicio = Table(
    'usuario_servicio',  # Nombre de la tabla intermedia
    db.metadata,  # Metadata de la base de datos
    # Definición de las columnas de la tabla intermedia
    Column('usuario_id', Integer, ForeignKey('usuario.id_usuario'), primary_key=True),  # Clave foránea que referencia a `usuarios`
    Column('servicio_id', Integer, ForeignKey('servicio.id_servicio'), primary_key=True)  # Clave foránea que referencia a `servicios`
)