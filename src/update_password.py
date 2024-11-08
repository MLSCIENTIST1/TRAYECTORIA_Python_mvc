from src.models.database import db
from src.models.usuarios import Usuario
from werkzeug.security import generate_password_hash
from src.app import app  # Importar la aplicación desde app.py

# La contraseña que ya tienes como hash
new_password = '123456'  # Reemplaza con la contraseña que hayas generado

# El correo del usuario cuyo password deseas actualizar
user_email = 'alguno@mail.com'  # Cambia esto al correo del usuario

# Generar el hash de la nueva contraseña
hashed_password = generate_password_hash(new_password, method='pbkdf2:sha256')

# Iniciar el contexto de la aplicación
with app.app_context():
    # Buscar al usuario en la base de datos
    user = Usuario.query.filter_by(correo=user_email).first()

    if user:
        # Si el usuario existe, actualizar la contraseña
        user.contrasenia = hashed_password
        db.session.commit()  # Guardar los cambios en la base de datos
        print(f"Contraseña actualizada para el usuario {user_email}")
    else:
        print(f"No se encontró un usuario con el correo {user_email}")