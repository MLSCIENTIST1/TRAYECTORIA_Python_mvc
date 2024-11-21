from flask import Blueprint, render_template
from flask_login import login_required, current_user
from src.models.usuarios import Usuario

profile_bp = Blueprint('profile', __name__)

@profile_bp.route('/loged')
@login_required
def editando():
    usuario = current_user
    return render_template('editando.html', usuario = usuario)