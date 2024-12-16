import logging
from datetime import datetime
from src.models.database import db

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

file_handler = logging.FileHandler('notifications.log')
file_handler.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)

class Notification(db.Model):
    __tablename__ = "notification"
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('usuario.id_usuario'), nullable=False)
    request_id = db.Column(db.Integer, nullable=True)  # ID de solicitud relacionado
    is_accepted = db.Column(db.Boolean, default=False)
    message = db.Column(db.String(256), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False)
    type = db.Column(db.String, default='default_type')
    extra_data = db.Column(db.JSON, nullable=True)
    
    @classmethod
    def create_notification(cls, user_id, request_id, message, params=None, extra_data=None):
        try:
            notification_type = params.get('type', 'default_type') if params else 'default_type'
            notification = cls(
                user_id=user_id,
                request_id=request_id,  # Asociar el ID de solicitud
                message=message,
                type=notification_type,
                extra_data=extra_data
            )
            db.session.add(notification)
            db.session.commit()
            return notification
        except Exception as e:
            logger.error(f"Error al crear la notificación: {e}", exc_info=True)
            db.session.rollback()
            raise