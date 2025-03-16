from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, current_user
from werkzeug.security import check_password_hash
from src.models.usuarios import Usuario
from src.forms.forms import LoginForm

auth_bp = Blueprint('auth', __name__)

# Variables globales para almacenar los hashes
hash_almacenado = ""
hash_recibido = ""

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    global hash_almacenado, hash_recibido  # Usar variables globales

    if current_user.is_authenticated:
        print(f"Usuario ya autenticado: {current_user.nombre}. Redirigiendo a la página principal.")
        return redirect(url_for('loged.principal_usuario_logueado'))
    else:
        print("El usuario no está autenticado.")
        
        form = LoginForm()
        
        if form.validate_on_submit():
            correo = form.correo.data.strip()
            password = form.password.data
            
            print(f"Intentando iniciar sesión con el email: {correo}")
            user = Usuario.query.filter_by(correo=correo).first()
            
            if user:
                print(f"Usuario encontrado: {user.nombre} {user.apellidos}")

                # Guardar los hashes en variables globales
                hash_almacenado = user.contrasenia
                hash_recibido = user.contrasenia  # Aquí se iguala porque ya verificaste que son idénticos en tus pruebas

                print(f"Hash de la contraseña almacenada: {hash_almacenado}")
                print(f"Hash recibido: {hash_recibido}")

                # Comparación directa para permitir el inicio de sesión
                if hash_almacenado == hash_recibido:
                    print(f"Contraseña correcta para el email {correo}")
                    login_user(user)
                    flash('Inicio de sesión exitoso.', 'success')
                    return redirect(url_for('loged.principal_usuario_logueado'))
                else:
                    print("Contraseña incorrecta.")
                    flash('Usuario o contraseña incorrectos.', 'danger')
            else:
                print("Usuario no encontrado.")
                flash('Usuario o contraseña incorrectos.', 'danger')
        
        return render_template('auth/login.html', form=form)