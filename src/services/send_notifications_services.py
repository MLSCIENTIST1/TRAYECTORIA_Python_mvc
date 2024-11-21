
def send_contract_request_notification(user_id, message):
    try:
        # Importa Notification solo cuando sea necesario
        from src.models.notification import Notification  # Importación diferida
        from src.models import db
        
        # Crear la notificación
        notification = Notification(user_id=user_id, message=message)
        
        # Agregar la notificación a la sesión de la base de datos
        db.session.add(notification)
        db.session.commit()  # Confirmar la transacción

        print(f"Notificación enviada a usuario {user_id}: {message}")
    except Exception as e:
        print(f"Error al enviar notificación: {e}")
        db.session.rollback()  # En caso de error, deshacer la tra