import logging
from flask import redirect, url_for, Blueprint, flash
from flask_login import login_required, current_user
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.sql import func
from src.models.notification import Notification
from src.models.usuarios import Usuario
from src.models.database import db
from src.services.send_notifications_services import send_contract_request_notification

# Crear un Blueprint para las notificaciones enviadas
notifications_bp = Blueprint('notifications', __name__)

# Configurar el logger
logger = logging.getLogger('app_notifications')
logger.setLevel(logging.DEBUG)

file_handler = logging.FileHandler('app_notifications.log')
file_handler.setLevel(logging.DEBUG)

formatter = logging.Formatter('%(asctime)s - %(levellevel)s - %(message)s')
file_handler.setFormatter(formatter)

logger.addHandler(file_handler)

@notifications_bp.route('/notifications/<int:candidato_id>', methods=['POST'])
@login_required
def notifications(candidato_id):
    logger.debug(f"Solicitud de contratación recibida para candidato_id {candidato_id}")
    
    # Verificar que el candidato existe
    try:
        candidato = Usuario.query.get_or_404(candidato_id)
        logger.debug(f"Candidato encontrado: {candidato.nombre}")
    except SQLAlchemyError as e:
        logger.error(f"Error al buscar el candidato con ID {candidato_id}: {e}", exc_info=True)
        flash("Error al buscar el candidato.", "danger")
        return "Error interno al buscar el candidato.", 500

    # Crear el mensaje de la notificación
    message = f'{current_user.nombre} te ha enviado una solicitud de contratación para el puesto de {candidato.labor}.'
    logger.info(f"Usuario {current_user.nombre} está enviando una solicitud de contratación a {candidato.nombre}")

    # Generar un nuevo request_id
    try:
        request_id = db.session.query(func.max(Notification.request_id)).scalar() or 0
        request_id += 1
        logger.debug(f"Nuevo request_id generado: {request_id}")
    except SQLAlchemyError as e:
        logger.error(f"Error al calcular el request_id: {e}", exc_info=True)
        flash("Error interno al calcular el ID de solicitud.", "danger")
        return "Error interno al calcular el ID de solicitud.", 500

    # Crear la notificación en la base de datos
    try:
        logger.debug("Intentando crear la notificación en la base de datos...")
        new_notification = Notification.create_notification(
            user_id=candidato.id_usuario,
            request_id=request_id,  # Asociar con el nuevo request_id
            message=message,
            params={'type': 'contract_request'},
            extra_data={"sender_id": current_user.id_usuario}
        )
        logger.info(f"Notificación creada exitosamente en la base de datos con ID {new_notification.id} y request_id {new_notification.request_id}")
    except SQLAlchemyError as e:
        logger.error(f"Error al intentar crear la notificación: {e}", exc_info=True)
        flash("Error interno al registrar la solicitud de contratación.", "danger")
        db.session.rollback()
        return "Error interno al registrar la solicitud de contratación.", 500

    # Enviar la notificación
    try:
        send_contract_request_notification(candidato.id_usuario, message)
        logger.info(f"Notificación enviada a {candidato.nombre} con el mensaje: {message}")
        flash('Solicitud de contratación registrada correctamente', 'success')
        return redirect(url_for('loged.principal_usuario_logueado'))
    except Exception as e:
        logger.error(f"Error al enviar la notificación: {e}", exc_info=True)
        flash("Error al enviar la solicitud de contratación.", "danger")
        return "Error interno al enviar la notificación.", 500