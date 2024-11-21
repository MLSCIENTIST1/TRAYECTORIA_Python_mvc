from flask import Blueprint, render_template, redirect, url_for, flash
from werkzeug.security import generate_password_hash
from src.models.usuarios import Usuario
from src.models.database import db
from src.forms.forms import RegisterForm  # Importa forms para usar `forms.RegisterForm`

register_bp = Blueprint('register', __name__)

@register_bp.route('/register', methods=['GET', 'POST'])
def register():
    form = RegisterForm()  # Accede a RegisterForm a través de forms
    if form.validate_on_submit():
        existing_user = Usuario.query.filter_by(correo=form.correo.data).first()
        if existing_user:
            flash('Ya existe una cuenta con ese correo.', 'danger')
            return redirect(url_for('register.register'))
        
        # Genera un hash de la contraseña
        hashed_password = generate_password_hash(form.contrasenia.data, method='pbkdf2:sha256')
        
        # Crea un nuevo usuario
        new_user = Usuario(
            nombre=form.nombre.data,
            apellidos=form.apellidos.data,
            cedula=form.cedula.data,
            correo=form.correo.data,
            contrasenia=hashed_password,
            labor=form.labor.data,
            celular=form.celular.data,
            ciudad=form.ciudad.data
        )
        
        # Agrega el nuevo usuario a la base de datos
        db.session.add(new_user)
        db.session.commit()
        
        flash('¡Te has registrado exitosamente!', 'success')
        return redirect(url_for('auth.login'))
    
    return render_template('register.html', form=form)