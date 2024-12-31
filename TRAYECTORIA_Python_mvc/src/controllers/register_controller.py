from flask import Blueprint, render_template, redirect, url_for, flash
from werkzeug.security import generate_password_hash
from src.models.usuarios import Usuario
from src.models.database import db
from src.forms.forms import RegisterForm

register_bp = Blueprint('register', __name__)

@register_bp.route('/register', methods=['GET', 'POST'])
def register():
    form = RegisterForm()
    
    if form.validate_on_submit():
        # Verifica si ya existe un usuario con el mismo correo
        existing_user = Usuario.query.filter_by(correo=form.correo.data).first()
        
        if existing_user:
            flash('Ya existe una cuenta con ese correo.', 'danger')
            return redirect(url_for('register.register'))
        
        # Genera el hash de la contraseña
        password = form.contrasenia.data.strip()
        hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
        print(f"Hash generado para el correo {form.correo.data}: {hashed_password}")
        
        try:
            # Crea un nuevo usuario con los datos del formulario
            new_user = Usuario(
                nombre=form.nombre.data,
                apellidos=form.apellidos.data,
                cedula=form.cedula.data,
                correo=form.correo.data,
                contrasenia=hashed_password,  # Almacena el hash de la contraseña
                labor=form.labor.data,
                celular=form.celular.data,
                ciudad=form.ciudad.data
            )
            
            # Agrega el nuevo usuario a la base de datos
            db.session.add(new_user)
            db.session.commit()
            
            flash('¡Te has registrado exitosamente!', 'success')
            return redirect(url_for('auth.login'))
        
        except Exception as e:
            print(f"Error al registrar usuario: {str(e)}")
            db.session.rollback()
            flash('Ocurrió un error durante el registro. Inténtalo de nuevo.', 'danger')
    
    return render_template('register.html', form=form)