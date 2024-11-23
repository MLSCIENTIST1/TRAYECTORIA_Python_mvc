import logging
from datetime import datetime
from src.models.database import db  # Asegúrate de importar db correctamente

# Configurar el logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Crear un manejador para que los logs se guarden en un archivo
file_handler = logging.FileHandler('notifications.log')
file_handler.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)

class Notification(db.Model):
    __tablename__ = "notification"
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('usuario.id_usuario'), nullable=False)
    message = db.Column(db.String(256), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False)
    type = db.Column(db.String, default='default_type')  # Ajustamos la columna para un valor por defecto
    extra_data = db.Column(db.JSON, nullable=True)

    def __repr__(self):
        return f'<Notification {self.message}>'

    @classmethod
    def create_notification(cls, user_id, message, params=None, extra_data=None):
        """ Método para crear una nueva notificación. """
        try:
            logger.info(f"Creando notificación para el usuario {user_id} con el mensaje: {message}")
            
            # Establecer el tipo de notificación según `params`, si existe
            notification_type = params.get('type', 'default_type') if params else 'default_type'
            
            notification = cls(
                user_id=user_id,
                message=message,
                type=notification_type,
                extra_data=extra_data
            )
            db.session.add(notification)
            db.session.commit()
            
            logger.info(f"Notificación creada y almacenada correctamente para el usuario {user_id}")
            return notification
        except Exception as e:
            logger.error(f"Error al crear la notificación para el usuario {user_id}: {e}", exc_info=True)
            db.session.rollback()  # Deshacer la transacción en caso de error
            raise

    def mark_as_read(self):
        """ Marca la notificación como leída. """
        try:
            logger.info(f"Marcando la notificación {self.id} como leída.")
            self.is_read = True
            db.session.commit()
            logger.info(f"Notificación {self.id} marcada como leída correctamente.")
        except Exception as e:
            logger.error(f"Error al marcar la notificación {self.id} como leída: {e}", exc_info=True)
            db.session.rollback()  # Deshacer la transacción en caso de error
            raise