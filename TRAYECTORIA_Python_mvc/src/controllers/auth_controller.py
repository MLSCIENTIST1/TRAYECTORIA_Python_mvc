from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, current_user
from werkzeug.security import check_password_hash
from src.models.usuarios import Usuario
from src.forms.forms import LoginForm

auth_bp = Blueprint('auth', __name__)

def comparar_contrasenia(hashed_password, plain_password):
    """
    Compara la contraseña ingresada con el hash almacenado.
    Retorna True si coinciden, False en caso contrario.
    """

    if not hashed_password or not plain_password:
        print("Error: Hash o contraseña vacíos.")
        return False

    print(f"\nHash almacenado en la base de datos: {hashed_password}")
    print(f"Contraseña ingresada por el usuario: {plain_password}")

    # Verificar tipo de datos antes de comparar
    print(f"Tipo de hash almacenado: {type(hashed_password)}")
    print(f"Tipo de contraseña ingresada: {type(plain_password)}")

    try:
        resultado = check_password_hash(hashed_password, plain_password)
        print(f"Resultado de comparación: {resultado}")
        return resultado
    except Exception as e:
        print(f"Error al comparar contraseñas: {str(e)}")
        return False

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        print(f"Usuario ya autenticado: {current_user.nombre}. Redirigiendo a la página principal.")
        return redirect(url_for('loged.principal_usuario_logueado'))
    else:
        print("El usuario no está autenticado.")

        form = LoginForm()

        if form.validate_on_submit():
            correo = form.correo.data.strip()
            password = form.password.data
            
            print(f"\nIntentando iniciar sesión con el email: {correo}")
            user = Usuario.query.filter_by(correo=correo).first()

            if user:
                print(f"Usuario encontrado: {user.nombre} {user.apellidos}")
                print(f"Hash de la contraseña almacenada en la BD: {user.contrasenia}")

                # Verificar que el hash esté correctamente almacenado
                if not user.contrasenia or "pbkdf2:sha256" not in user.contrasenia:
                    print("Error: El hash almacenado en la base de datos no es válido.")
                    flash("Error interno. Contacta al administrador.", "danger")
                    return render_template('auth/login.html', form=form)

                # Comparar la contraseña ingresada con el hash almacenado
                if comparar_contrasenia(user.contrasenia, password):
                    print(f"✅ Contraseña correcta para el email {correo}")
                    login_user(user)
                    flash('Inicio de sesión exitoso.', 'success')
                    return redirect(url_for('loged.principal_usuario_logueado'))
                else:
                    print("❌ Contraseña incorrecta.")
                    flash('Usuario o contraseña incorrectos.', 'danger')
            else:
                print("❌ Usuario no encontrado.")
                flash('Usuario o contraseña incorrectos.', 'danger')

        return render_template('auth/login.html', form=form)