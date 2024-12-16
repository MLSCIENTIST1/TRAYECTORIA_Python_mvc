from flask import Blueprint, request, redirect, url_for, flash, render_template
from flask_login import login_required, current_user
from datetime import datetime
from src.models.notification import Notification
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

recive_notifications_bp = Blueprint('recive', __name__)

@recive_notifications_bp.route('/recive', methods=['GET', 'POST'])
@login_required
def show_notifications():
    if request.method == 'POST':
        return "Solicitud POST recibida"
    
    notifications = Notification.query.filter_by(user_id=current_user.id_usuario).order_by(Notification.timestamp.desc()).all()
    
    Notification.query.filter_by(user_id=current_user.id_usuario, is_read=False).update({'is_read': True})
    db.session.commit()
    
    return render_template('show_notifications.html', notifications=notifications)

@recive_notifications_bp.route('/notification/<int:notification_id>/accept', methods=['POST'])
@login_required
def accept_notification(notification_id):
    notification = Notification.query.get(notification_id)
    
    if notification and notification.user_id == current_user.id_usuario:
        if notification.is_accepted:
            flash("Ya has aceptado esta solicitud de contratación.", "danger")
        else:
            # Obtener datos del servicio desde la notificación
            nombre_servicio = notification.message
            fecha_solicitud = notification.timestamp.date()
            fecha_aceptacion = datetime.utcnow().date()
            fecha_inicio = fecha_aceptacion  # Supongamos que empieza el mismo día
            fecha_fin = fecha_aceptacion.replace(year=fecha_aceptacion.year + 1)  # Supongamos un año de duración
            nombre_contratante = current_user.nombre
            
            # Crear una nueva instancia del Servicio
            nuevo_servicio = Servicio(
                nombre_servicio=nombre_servicio,
                fecha_solicitud=fecha_solicitud,
                fecha_aceptacion=fecha_aceptacion,
                fecha_inicio=fecha_inicio,
                fecha_fin=fecha_fin,
                nombre_contratante=nombre_contratante
            )
            
            # Guardar en la base de datos
            db.session.add(nuevo_servicio)
            db.session.commit()
            
            # Marcar la notificación como aceptada
            notification.is_accepted = True
            db.session.commit()
            
            flash(f"Solicitud aceptada y servicio registrado con ID {nuevo_servicio.id_servicio}.", "success")
    else:
        flash("Notificación no encontrada o no autorizada.", "error")
    
    return redirect(url_for('recive.show_notifications'))

@recive_notifications_bp.route('/notification/<int:notification_id>/reject', methods=['POST'])
@login_required
def reject_notification(notification_id):
    notification = Notification.query.get(notification_id)
    
    if notification and notification.user_id == current_user.id_usuario:
        flash("Notificación rechazada.")
    else:
        flash("Notificación no encontrada o no autorizada.", "error")
    
    return redirect(url_for('recive.show_notifications'))

@recive_notifications_bp.route('/more_details/<int:notification_id>', methods=['POST'])
@login_required
def more_details(notification_id):
    question = request.form.get('question')
    
    if not question or not question.strip():
        flash('La pregunta no puede estar vacía.', 'error')
        return redirect(url_for('recive.show_notifications'))
    
    notification = Notification.query.get(notification_id)
    
    if notification and notification.user_id == current_user.id_usuario:
        # Crear una nueva notificación para la pregunta y conservar el request_id
        new_notification = Notification.create_notification(
            user_id=current_user.id_usuario,
            request_id=notification.request_id,  # Mantener el ID de solicitud original
            message=f"Solicitud de más detalles: {question}",
            extra_data={'questions': [{'question': question, 'timestamp': datetime.utcnow().isoformat()}]}
        )
        
        logger.debug(f"Pregunta asociada con request_id: {notification.request_id}")
        flash('Tu solicitud de detalles ha sido enviada.', 'success')
    else:
        flash("Notificación no encontrada o no autorizada.", "error")
    
    return redirect(url_for('recive.show_notifications'))