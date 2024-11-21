# src/controllers/sended_controller.py
from flask import request, redirect, url_for, Blueprint
from flask_login import login_required, current_user
from src.services.send_notifications_services import send_contract_request_notification  # Importa la función de servicio
from src.models.usuarios import Usuario

# Crear un Blueprint para las notificaciones enviadas
notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('/notifications/<int:candidato_id>', methods=['POST'])
@login_required
def notifications(candidato_id):
    """
    Este endpoint maneja el envío de una notificación de solicitud de contratación.
    Se invoca cuando un usuario envía una solicitud de contratación a un candidato.
    """
    print(f"Solicitud de contratación recibida para candidato_id {candidato_id}")  # Depuración
    
    # Buscar al candidato por su ID
    candidato = Usuario.query.get_or_404(candidato_id)  # Obtener el usuario candidato
    
    if candidato:
        # Crear el mensaje de la notificación
        message = f'{current_user.nombre} te ha enviado una solicitud de contratación para el puesto de {candidato.labor}.'
        
        # Enviar la notificación al candidato
        send_contract_request_notification(candidato.id, message)
        
        # Redirigir a la página principal del usuario logueado
        print(f"Notificación enviada a {candidato.nombre}")
        return redirect(url_for('loged.principal_usuario_logueado'))
    else:
        # Si no encontramos al candidato
        print("Candidato no encontrado")
        return "Candidato no encontrado", 404