import logging
from flask import Blueprint, render_template, redirect, url_for, flash
from flask_login import login_user, current_user
from src.models.usuarios import Usuario
from src.forms.forms import LoginForm

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
ch.setFormatter(formatter)
logger.addHandler(ch)

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        # Si el usuario ya está autenticado, redirigirlo
        flash(f"Ya has iniciado sesión como {current_user.nombre}.", "info")
        return redirect(url_for('loged.principal_usuario_logueado'))

    form = LoginForm()

    if form.validate_on_submit():
        # Obtener los datos del formulario
        correo = form.correo.data.strip()
        password_ingresada = form.password.data

        # Buscar al usuario por su correo
        usuario = Usuario.query.filter_by(correo=correo).first()

        if usuario:
            # Verificar si el usuario está activo
            if not usuario.active:
                logger.debug("no se encuentra activo el usuario")
                flash('Tu cuenta está desactivada. Contacta con soporte para reactivarla.', 'warning')
                return redirect(url_for('auth.login'))

            # Comprobar si la contraseña ingresada coincide con la almacenada
            if usuario.contrasenia == password_ingresada:
                login_user(usuario)
                flash('Inicio de sesión exitoso.', 'success')
                return redirect(url_for('loged.principal_usuario_logueado'))
            else:
                flash('Usuario o contraseña incorrectos.', 'danger')
        else:
            flash('Usuario o contraseña incorrectos.', 'danger')

    # Renderizar el formulario de login si no se valida o si hay errores
    return render_template('auth/login.html', form=form)