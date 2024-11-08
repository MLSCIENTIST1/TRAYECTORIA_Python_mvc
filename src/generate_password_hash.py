from werkzeug.security import generate_password_hash

# La contraseña original
password = "123456"  # Cambia esto por la contraseña que quieras

# Generar el hash de la contraseña usando sha256
hashed_password = generate_password_hash(password, method='pbkdf2:sha256')

# Imprimir el hash generado para que puedas copiarlo y usarlo
print(f"Hash de la contraseña: {hashed_password}")