from flask import Blueprint, request, redirect, url_for, flash, render_template
from flask_login import login_required, current_user
from datetime import datetime
from src.models.notification import Notification
from src.models.message import Message
from src.models.database import db
from src.models.servicio import Servicio
import logging

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
            logger.warning(f"Intento no autorizado de aceptar notificación {notification_id}.")
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

# Solicitar más detalles
@recive_notifications_bp.route('/detail/notification/<int:notification_id>/detail', methods=['POST'])
@login_required
def more_details(notification_id):
    questions = request.form.get('questions', '').strip()
    if not questions:
        flash("Por favor, escribe una pregunta antes de enviar.", "error")
        return redirect(url_for('recive.show_notifications'))
    
    logger.info(f"Solicitud de más detalles recibida para notification_id {notification_id} con pregunta: {questions}")
    
    try:
        # Buscar la notificación
        notification = Notification.query.get_or_404(notification_id)
        
        # Verificar si el usuario está autorizado para interactuar con la notificación
        if notification.user_id != current_user.id_usuario:
            flash("No estás autorizado para realizar esta acción.", "error")
            logger.warning(f"Intento no autorizado de interactuar con notificación {notification_id}.")
            return redirect(url_for('recive.show_notifications'))
        
        # Crear un nuevo mensaje
        message = Message(
            notification_id=notification_id,
            sender_id=current_user.id_usuario,
            receiver_id=notification.user_id,
            content=questions
        )
        
        # Guardar el mensaje en la base de datos
        db.session.add(message)
        db.session.commit()
        
        logger.info(f"Mensaje agregado a la conversación de la notificación {notification_id}: {questions}")
        flash("Mensaje enviado exitosamente.", 'success')
        
        # Redirigir al chat después de guardar el mensaje
        return redirect(url_for('recive.chat', notification_id=notification_id))
    
    except Exception as e:
        logger.exception(f"Error al agregar mensaje para notification_id {notification_id}: {e}")
        db.session.rollback()
        flash("Hubo un error al procesar tu solicitud.", 'error')
    return redirect(url_for('recive.show_notifications'))

# Cargar chat
@recive_notifications_bp.route('/notification/<int:notification_id>/chat', methods=['GET'])
@login_required
def chat(notification_id):
    try:
        notification = Notification.query.get_or_404(notification_id)
        if notification.user_id != current_user.id_usuario:
            flash("No estás autorizado para ver esta conversación.", "error")
            return redirect(url_for('recive.show_notifications'))
        
        messages = Message.query.filter_by(notification_id=notification_id).order_by(Message.timestamp).all()
        if not messages:
            flash("No hay mensajes en esta conversación.", "info")
        return render_template('chat.html', messages=messages, notification_id=notification_id)
    except Exception as e:
        logger.exception("Error al cargar el chat.")
        flash("No se pudo cargar la conversación.", "error")
    return redirect(url_for('recive.show_notifications'))