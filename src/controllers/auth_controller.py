from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, current_user
from src.models.usuarios import Usuario
from src.forms.forms import LoginForm 
from src.models import usuario_servicio


auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    # Si el usuario ya está autenticado, redirigirlo a la página principal
    if current_user.is_authenticated:
        print("Usuario ya está logueado, redirigiendo a la página principal.")
        return redirect(url_for('loged.principal_usuario_logueado'))

    # Usar Flask-WTF Formulario para manejar el login
    form = LoginForm()

    if form.validate_on_submit():  # Si la validación del formulario es exitosa
        correo = form.correo.data  # Obtener el email del formulario
        password = form.password.data  # Obtener la contraseña del formulario

        print(f"Intentando iniciar sesión con el email: {correo}")  # Depuración

        # Buscar el usuario por correo electrónico
        user = Usuario.query.filter_by(correo=correo).first()

        if user:
            print(f"Usuario encontrado: {user.nombre} {user.apellidos}")
            print(f"Hash de la contraseña almacenada: {user.contrasenia}")
            print(f"Contraseña ingresada: {password}")

            # Verificar la contraseña usando el método check_password
            if user.check_password(password):
                print(f"Contraseña correcta para el email {correo}")  # Depuración
                login_user(user)
                return redirect(url_for('loged.principal_usuario_logueado'))
            else:
                print("Contraseña incorrecta")  # Depuración
        else:
            print("Usuario no encontrado.")  # Depuración
        flash('Usuario o contraseña incorrectos.', 'error')

    return render_template('auth/login.html', form=form)