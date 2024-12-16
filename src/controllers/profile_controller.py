from flask import Blueprint, render_template, redirect, url_for, flash
from flask_login import login_required, current_user
from src.models.database import db
from src.forms import EditProfileForm
from src.models.usuarios import Usuario

profile_bp = Blueprint('profile', __name__)

@profile_bp.route('/loged')
@login_required
def editando():
    usuario = current_user
    return render_template('editando.html', usuario = usuario)





@profile_bp.route('/edit', methods=['GET', 'POST'])
@login_required
def edit_profile():
    form = EditProfileForm(obj=current_user)  # Cargar datos del usuario actual en el formulario
    if form.validate_on_submit():
        # Actualizar los datos del usuario logueado
        current_user.nombre = form.nombre.data
        current_user.apellidos = form.apellidos.data
        current_user.celular = form.celular.data
        current_user.ciudad = form.ciudad.data
        db.session.commit()
        flash('Perfil actualizado correctamente.', 'success')
        return redirect(url_for('profile.editando'))
    return render_template('editar_perfil.html', form=form)
