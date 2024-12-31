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
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
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
        logger.exception("Error al buscar el candidato.")
        flash("Error al buscar el candidato.", "danger")
        return "Error interno al buscar el candidato.", 500

    # Crear el mensaje de la notificación
    message = f'{current_user.nombre} te ha enviado una solicitud de contratación para el puesto de {candidato.labor}.'
    logger.info(f"Usuario {current_user.nombre} está enviando una solicitud a {candidato.nombre}")

    # Verificar si ya existe una notificación
    if Notification.query.filter_by(user_id=candidato.id_usuario, message=message).first():
        logger.warning(f"Ya existe una notificación para el candidato ID {candidato.id_usuario} con el mismo mensaje.")
        flash('Ya se ha enviado una solicitud de contratación a este candidato.', 'warning')
        return redirect(url_for('loged.principal_usuario_logueado'))

    # Generar un nuevo request_id
    try:
        request_id = db.session.query(func.coalesce(func.max(Notification.request_id), 0) + 1).scalar()
        logger.debug(f"Nuevo request_id generado: {request_id}")
    except SQLAlchemyError as e:
        logger.exception("Error al calcular el request_id.")
        flash("Error interno al calcular el ID de solicitud.", "danger")
        return "Error interno al calcular el ID de solicitud.", 500

    # Crear y enviar la notificación
    try:
        new_notification = Notification.create_notification(
            user_id=candidato.id_usuario,
            request_id=request_id,
            message=message,
            params={'type': 'contract_request'},
            extra_data={"sender_id": current_user.id_usuario}
        )
        db.session.commit()  # Confirmar la transacción
        logger.info(f"Notificación creada con ID {new_notification.id} y request_id {new_notification.request_id}")

        send_contract_request_notification(candidato.id_usuario, message)
        flash('Solicitud de contratación registrada correctamente.', 'success')

    except SQLAlchemyError as e:
        logger.exception("Error al registrar la solicitud en la base de datos.")
        db.session.rollback()
        flash("Error interno al registrar la solicitud de contratación.", "danger")
        return "Error interno al registrar la solicitud.", 500

    except Exception as e:
        logger.exception("Error al enviar la notificación.")
        flash("Error al enviar la solicitud de contratación.", "danger")
        return "Error interno al enviar la notificación.", 500

    return redirect(url_for('loged.principal_usuario_logueado'))