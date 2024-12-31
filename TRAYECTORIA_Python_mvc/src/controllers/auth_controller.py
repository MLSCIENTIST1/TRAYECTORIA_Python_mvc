from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, current_user
from src.models.usuarios import Usuario
from src.forms.forms import LoginForm

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    # Verifica si el usuario ya está autenticado
    if current_user.is_authenticated:
        print(f"Usuario ya autenticado: {current_user.nombre}. Redirigiendo a la página principal.")
        return redirect(url_for('loged.principal_usuario_logueado'))
    else:
        print("El usuario no está autenticado.")
        
        # Si no está autenticado, muestra el formulario de inicio de sesión
        form = LoginForm()
        
        # Si el formulario es válido al enviarlo
        if form.validate_on_submit():
            correo = form.correo.data.strip()
            password = form.password.data
            
            print(f"Intentando iniciar sesión con el email: {correo}")
            user = Usuario.query.filter_by(correo=correo).first()
            
            if user:
                print(f"Usuario encontrado: {user.nombre} {user.apellidos}")
                print(f"Hash de la contraseña almacenada: {user.contrasenia}")
                
                # Verifica si la contraseña es correcta
                if user.check_password(password):
                    print(f"Contraseña correcta para el email {correo}")
                    login_user(user)  # Autentica al usuario
                    flash('Inicio de sesión exitoso.', 'success')
                    return redirect(url_for('loged.principal_usuario_logueado'))
                else:
                    print("Contraseña incorrecta.")
            else:
                print("Usuario no encontrado.")
                
            flash('Usuario o contraseña incorrectos.', 'danger')
        
        return render_template('auth/login.html', form=form)