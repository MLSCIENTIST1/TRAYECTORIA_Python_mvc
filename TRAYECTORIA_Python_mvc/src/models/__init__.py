from .notification import Notification
from .servicio import Servicio
from .message import Message
from .usuarios import Usuario
from .calificacion import Calificacion 
from .aditional_services import AditionalService
from .etapa import Etapa  # Nuevo modelo
from .foto import Foto  # Nuevo modelo
from .audio import Audio  # Nuevo modelo
from .video import Video  # Nuevo modelo

from src.models.database import db, init_app, create_database, DATABASE_URL

# Crear la base de datos al cargar el módulo
create_database()

# Exportar funciones clave para otros módulos
__all__ = ["db", "init_app", "DATABASE_URL"]