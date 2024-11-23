import logging
from flask import redirect, url_for, Blueprint, flash
from flask_login import login_required, current_user
from src.models.notification import Notification
from src.services.send_notifications_services import send_contract_request_notification
from src.models.usuarios import Usuario

# Crear un Blueprint para las notificaciones enviadas
notifications_bp = Blueprint('notifications', __name__)

# Configurar el logger
logger = logging.getLogger('app_notifications')
logger.setLevel(logging.DEBUG)

# Crear un manejador para que los logs se guarden en un archivo
file_handler = logging.FileHandler('app_notifications.log')
file_handler.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)

@notifications_bp.route('/notifications/<int:candidato_id>', methods=['POST'])
@login_required
def notifications(candidato_id):
    """Este endpoint maneja el envío de una notificación de solicitud de contratación.
    Se invoca cuando un usuario envía una solicitud de contratación a un candidato.
    """
    logger.debug(f"Solicitud de contratación recibida para candidato_id {candidato_id}")
    
    # Buscar al candidato por su ID
    candidato = Usuario.query.get_or_404(candidato_id)  # Obtener el usuario candidato
    logger.debug(f"Candidato encontrado: {candidato.nombre}")

    if candidato:
        # Crear el mensaje de la notificación
        message = f'{current_user.nombre} te ha enviado una solicitud de contratación para el puesto de {candidato.labor}.'
        logger.info(f"Usuario {current_user.nombre} está enviando una solicitud de contratación a {candidato.nombre}")

        try:
            # Crear la notificación en la base de datos
            logger.debug("Intentando crear la notificación en la base de datos...")
            Notification.create_notification(
                user_id=candidato.id_usuario,
                message=message,
                params={'type': 'contract_request'},
                extra_data={"sender_id": current_user.id_usuario}
            )
            logger.info("Notificación creada exitosamente en la base de datos")

            # Llamar a la función para enviar la notificación
            send_contract_request_notification(candidato.id_usuario, message)  # Llamada a la función que maneja la notificación
            logger.info(f"Notificación enviada a {candidato.nombre} con el mensaje: {message}")

            # Redirigir a la página principal del usuario logueado
            flash('Solicitud de contratación registrada correctamente', 'success')
            return redirect(url_for('loged.principal_usuario_logueado'))

        except Exception as e:
            logger.error(f"Error al intentar enviar la notificación a {candidato.nombre}: {e}", exc_info=True)
            flash(f'Error al registrar la solicitud de contratación: {e}', 'danger')
            return "Hubo un error al enviar la notificación", 500

    else:
        # Si no encontramos al candidato
        logger.warning(f"Candidato con ID {candidato_id} no encontrado.")
        flash('Candidato no encontrado', 'warning')
        return "Candidato no encontrado", 404