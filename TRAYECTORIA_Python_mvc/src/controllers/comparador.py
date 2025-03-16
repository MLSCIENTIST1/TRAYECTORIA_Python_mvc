from werkzeug.security import check_password_hash

def comparar_contrasenia(hashed_password, password):
    """
    Compara la contraseña en texto plano con el hash almacenado en la base de datos.
    Retorna True si coinciden, False de lo contrario.
    """
    if not hashed_password:
        print("El hash proporcionado está vacío o es inválido.")
        return False

    if not password:
        print("La contraseña proporcionada está vacía o es inválida.")
        return False

    print(f"Hash recibido: {hashed_password}")
    print(f"Contraseña ingresada: {password}")
    
    try:
        resultado = check_password_hash(hashed_password, password)
        print(f"Resultado de comparación: {resultado}")
        return resultado
    except Exception as e:
        print(f"Error al comparar contraseñas: {str(e)}")
        return False