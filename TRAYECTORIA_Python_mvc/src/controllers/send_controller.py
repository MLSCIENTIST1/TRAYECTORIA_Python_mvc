import logging
from flask import redirect, url_for, Blueprint, flash, request
from flask_login import login_required, current_user
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.sql import func
from src.models.notification import Notification
from src.models.usuarios import Usuario
from src.models.message import Message
from src.models.database import db
from src.services.send_notifications_services import send_contract_request_notification

# Crear un Blueprint para las notificaciones enviadas
notifications_bp = Blueprint('notifications', __name__)

# Configurar el logger
logger = logging.getLogger('app_notifications')
logger.setLevel(logging.DEBUG)
file_handler = logging.FileHandler('app_notifications.log')
file_handler.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)

@notifications_bp.route('/notifications/<int:candidato_id>', methods=['POST'])
@login_required
def notifications(candidato_id):
    logger.debug(f"Solicitud de contratación recibida para candidato_id {candidato_id}")

    try:
        candidato = Usuario.query.get_or_404(candidato_id)
        logger.debug(f"Candidato encontrado: {candidato.nombre}")
    except SQLAlchemyError:
        logger.exception("Error al buscar el candidato.")
        flash("Error al buscar el candidato.", "danger")
        return "Error interno al buscar el candidato.", 500

    user_message = request.form['mensaje']
    notification_message = f'{current_user.nombre} te ha enviado una solicitud de contratación para el puesto de {candidato.labor}. Mensaje: {user_message}'

    logger.info(f"Usuario {current_user.nombre} está enviando una solicitud a {candidato.nombre} con el mensaje: {user_message}")

    if Notification.query.filter_by(user_id=candidato.id_usuario, message=notification_message).first():
        logger.warning(f"Ya existe una notificación para el candidato ID {candidato.id_usuario} con el mismo mensaje.")
        flash('Ya se ha enviado una solicitud de contratación a este candidato.', 'warning')
        return redirect(url_for('loged.principal_usuario_logueado'))

    try:
        request_id = db.session.query(func.coalesce(func.max(Notification.request_id), 0) + 1).scalar()
        logger.debug(f"Nuevo request_id generado: {request_id}")
    except SQLAlchemyError:
        logger.exception("Error al calcular el request_id.")
        flash("Error interno al calcular el ID de solicitud.", "danger")
        return "Error interno al calcular el ID de solicitud.", 500

    try:
        new_notification = Notification.create_notification(
            user_id=candidato.id_usuario,
            sender_id=current_user.id_usuario,
            request_id=request_id,
            message=notification_message,
            params={'type': 'contract_request'},
            extra_data={"sender_id": current_user.id_usuario}
        )
        
        new_message = Message(
            notification_id=new_notification.id,
            sender_id=current_user.id_usuario,
            receiver_id=candidato.id_usuario,
            content=user_message
        )
        db.session.add(new_message)
        db.session.commit()

        logger.info(f"Notificación creada con ID {new_notification.id} y request_id {new_notification.request_id}")
        logger.info(f"Mensaje creado con ID {new_message.id}")

        send_contract_request_notification(candidato.id_usuario, notification_message)
        flash('Solicitud de contratación registrada correctamente.', 'success')

    except SQLAlchemyError:
        logger.exception("Error al registrar la solicitud en la base de datos.")
        db.session.rollback()
        flash("Error interno al registrar la solicitud de contratación.", "danger")
        return "Error interno al registrar la solicitud.", 500

    except Exception:
        logger.exception("Error al enviar la notificación.")
        flash("Error al enviar la solicitud de contratación.", "danger")
        return "Error interno al enviar la notificación.", 500

    return redirect(url_for('loged.principal_usuario_logueado'))