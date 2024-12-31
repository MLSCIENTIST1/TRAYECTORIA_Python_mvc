from flask import Blueprint, request, redirect, url_for, flash, render_template, jsonify
from flask_login import login_required, current_user
from datetime import datetime
from src.models.notification import Notification
from src.models.database import db
from src.models.servicio import Servicio
import logging
from src.models.usuarios import Usuario

# Configurar logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
ch.setFormatter(formatter)
logger.addHandler(ch)

# Define Blueprints
recive_notifications_bp = Blueprint('recive', __name__)
detail_request_bp = Blueprint('detail_request', __name__)

# Mostrar notificaciones
@recive_notifications_bp.route('/recive', methods=['GET', 'POST'])
@login_required
def show_notifications():
    if request.method == 'POST':
        return "Solicitud POST recibida"
    
    try:
        notifications = Notification.query.filter_by(user_id=current_user.id_usuario) \
            .order_by(Notification.timestamp.desc()).all()
        
        # Marcar como leídas
        Notification.query.filter_by(user_id=current_user.id_usuario, is_read=False).update({'is_read': True})
        db.session.commit()
    
    except Exception as e:
        logger.exception("Error al recuperar notificaciones.")
        flash("No se pudieron cargar las notificaciones.", "error")
        notifications = []
    
    return render_template('show_notifications.html', notifications=notifications)

# Aceptar notificación
@recive_notifications_bp.route('/notification/<int:notification_id>/accept', methods=['POST'])
@login_required
def accept_notification(notification_id):
    try:
        notification = Notification.query.get_or_404(notification_id)
        
        if notification.user_id != current_user.id_usuario:
            flash("Notificación no autorizada.", "error")
            logger.warning("Intento no autorizado de aceptar notificación.")
            return redirect(url_for('recive.show_notifications'))
        
        if notification.is_accepted:
            flash("Ya has aceptado esta solicitud.", "warning")
            logger.info(f"Notificación {notification_id} ya aceptada previamente.")
        else:
            Notification.accept_notification(notification_id)
            servicio = create_service_from_notification(notification)
            db.session.commit()
            flash(f"Solicitud aceptada y servicio registrado con ID {servicio.id_servicio}.", "success")
    
    except Exception as e:
        logger.exception("Error al aceptar la notificación.")
        db.session.rollback()
        flash("Hubo un error al procesar tu solicitud.", "error")
    
    return redirect(url_for('recive.show_notifications'))

# Crear servicio basado en notificación
def create_service_from_notification(notification):
    """ Crear un servicio basado en los datos de la notificación. """
    try:
        servicio = Servicio(
            nombre_servicio=notification.message,
            fecha_solicitud=notification.timestamp.date(),
            fecha_aceptacion=datetime.utcnow().date(),
            fecha_inicio=datetime.utcnow().date(),
            fecha_fin=(datetime.utcnow().replace(year=datetime.utcnow().year + 1)).date(),
            nombre_contratante=current_user.nombre,
            id_contratante=current_user.id_usuario
        )
        db.session.add(servicio)
        db.session.flush()  # Obtener el ID generado antes de commit
        return servicio
    except Exception as e:
        logger.exception("Error al crear el servicio a partir de la notificación.")
        raise

# Rechazar notificación
@recive_notifications_bp.route('/notification/<int:notification_id>/reject', methods=['POST'])
@login_required
def reject_notification(notification_id):
    try:
        notification = Notification.query.get_or_404(notification_id)
        
        if notification.user_id != current_user.id_usuario:
            flash("Notificación no autorizada.", "error")
            logger.warning(f"Intento de rechazo no autorizado para notificación {notification_id}.")
            return redirect(url_for('recive.show_notifications'))
        
        notification.is_rejected = True
        db.session.commit()
        flash("Notificación rechazada exitosamente.", "success")
        logger.info(f"Notificación {notification_id} rechazada.")
    
    except Exception as e:
        logger.exception("Error al rechazar la notificación.")
        flash("Hubo un error al procesar la solicitud.", "error")
    
    return redirect(url_for('recive.show_notifications'))

# Solicitar más detalles de la notificación
@recive_notifications_bp.route('/detail/notification/<int:notification_id>/detail', methods=['POST'])
@login_required
def more_details(notification_id):
    questions = request.form.get('questions', '').strip()
    
    if not questions:
        flash("Por favor, escribe una pregunta antes de enviar.", "error")
        return redirect(url_for('recive.show_notifications'))
    
    logger.info(f"Solicitud de más detalles recibida para notification_id {notification_id} con pregunta: {questions}")
    
    try:
        notification = Notification.query.filter_by(request_id=notification_id).first()
        
        if not notification:
            logger.error(f"No se encontró la notificación con request_id {notification_id}")
            flash("No se encontró la notificación.", "error")
            return redirect(url_for('recive.show_notifications'))
        
        logger.debug(f"Notificación encontrada: {notification}")
        notification.questions = questions
        logger.debug(f"Asignando pregunta a la notificación: {notification.questions}")
        
        # Guardar el mensaje en request_message_details
        notification.request_message_details = f"El usuario {current_user.nombre} ha solicitado más detalles para la solicitud de contratación número {notification.request_id}.  "
        
        db.session.flush()  # Obtener el ID generado antes de commit
        db.session.commit()
        
        # Enviar notificación al usuario solicitante
        send_question_notification(notification)
        
        logger.info(f"Pregunta guardada en la notificación {notification_id}: {questions}")
        flash("Solicitud enviada exitosamente.", "success")
    
    except Exception as e:
        logger.exception(f"Error al procesar la solicitud de más detalles para notification_id {notification_id}: {e}")
        db.session.rollback()
        flash("Hubo un error al procesar tu solicitud.", "error")
    
    return redirect(url_for('recive.show_notifications'))

# Enviar notificación al usuario solicitante
def send_question_notification(notification):
    try:
        # Obtener el usuario que hizo la solicitud de contratación
        user = Usuario.query.get(notification.user_id)
        
        if not user:
            logger.error(f"Usuario no encontrado para la notificación con ID: {notification.id}")
            return
        
        # Crear una nueva notificación para el usuario solicitante
        new_notification = Notification(
            user_id=user.id,
            request_id=notification.request_id,
            message=f"Tienes una nueva pregunta sobre tu solicitud: {notification.questions}",
            timestamp=datetime.utcnow(),
            is_read=False
        )
        db.session.add(new_notification)
        db.session.commit()
        
        logger.info(f"Notificación enviada al usuario {user.id} con la pregunta: {notification.questions}")
    
    except Exception as e:
        logger.exception(f"Error al enviar la notificación de la pregunta al usuario: {e}")