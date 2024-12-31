from flask import Blueprint, render_template
from flask_login import current_user
from src.models.servicio import Servicio

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard')
def dashboard():
    # Obtener cantidad de contratos vigentes
    contract_count = Servicio.query.filter_by(id_contratante=current_user.id_usuario).count()
    return render_template('dashboard.html', contract_count=contract_count)

@dashboard_bp.route('/vigent_contracts')
def vigent_contracts():
    # Obtener los contratos vigentes
    contracts = Servicio.query.filter_by(id_contratante=current_user.id_usuario).all()
    return render_template('vigent_contracts.html', contracts=contracts)