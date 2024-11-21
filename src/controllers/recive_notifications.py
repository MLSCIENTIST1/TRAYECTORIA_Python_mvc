# src/controllers/recive_notifications.py
from flask import Blueprint, render_template
from flask_login import login_required, current_user
from src.models.notification import Notification
from src.models.database import db

# Crear un Blueprint para las notificaciones recibidas
recive_notifications_bp = Blueprint('recive', __name__)

@recive_notifications_bp.route('/recive')
@login_required
def show_notifications():
    """
    Este endpoint muestra las notificaciones que ha recibido el usuario logueado.
    Las notificaciones se marcan como leídas.
    """
    # Obtener las notificaciones del usuario logueado
    notifications = Notification.query.filter_by(user_id=current_user.id).order_by(Notification.timestamp.desc()).all()

    # Marcar todas las notificaciones como leídas
    for notification in notifications:
        notification.is_read = True
    db.session.commit()  # Confirmar los cambios en la base de datos

    # Renderizar la plantilla 'show_notifications.html' con las notificaciones
    return render_template('show_notifications.html', notifications=notifications)