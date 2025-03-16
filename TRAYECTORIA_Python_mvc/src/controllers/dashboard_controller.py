import logging
from flask import Blueprint, render_template, flash, redirect, url_for, request
from flask_login import current_user
from src.models.servicio import Servicio
from src.models.calificacion import Calificacion
from src.models.database import db
from sqlalchemy import or_

# Configuración del logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
ch.setFormatter(formatter)
logger.addHandler(ch)

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard')
def dashboard():
    try:
        # Contar contratos vigentes donde el usuario es contratante
        contract_count_contratante = Servicio.query.filter_by(id_contratante=current_user.id_usuario).count()
        logger.debug(f"Cantidad de contratos actuales: {contract_count_contratante}")

        contract_count_contratado = Servicio.query.filter_by(id_contratado=current_user.id_usuario).count()
        logger.debug(f"Cantidad de contratos actuales:para contratado: {contract_count_contratado},para contratante: {contract_count_contratante}")


        return render_template('dashboard.html', contract_count_contratante=contract_count_contratante, contract_count_contratado=contract_count_contratado)
    except Exception as e:
        logger.exception("Error al cargar el dashboard.")
        flash("Hubo un error al cargar el dashboard.", "error")
        return redirect(url_for('main.home'))

@dashboard_bp.route('/vigent_contracts')
def vigent_contracts():
    try:
        # Obtener contratos donde el usuario es contratante o contratado
        contracts = Servicio.query.filter(
            or_(
                Servicio.id_contratante == current_user.id_usuario, 
                Servicio.id_contratado == current_user.id_usuario
            )
        ).all()

        # Log para depuración
        logger.debug(f"Contratos vigentes para el usuario {current_user.id_usuario}: {[c.id_servicio for c in contracts]}")

        return render_template('vigent_contracts.html', contracts=contracts, contract_count=len(contracts))
    except Exception as e:
        logger.exception("Error al obtener los contratos vigentes.")
        flash("Hubo un error al cargar los contratos vigentes.", "error")
        return redirect(url_for('dashboard.dashboard'))

@dashboard_bp.route('/rate_contratante/<int:servicio_id>', methods=['POST'])
def rate_contratante(servicio_id):
    try:
        servicio = Servicio.query.get_or_404(servicio_id)

        # Validar que el usuario sea el contratante
        if servicio.id_contratante != current_user.id_usuario:
            flash("No puedes calificar este servicio si no eres el contratante.", "error")
            return redirect(url_for('dashboard.vigent_contracts'))

        # Obtener calificaciones del formulario
        cal1 = request.form.get('cal_contratante1', type=int)
        cal2 = request.form.get('cal_contratante2', type=int)
        cal3 = request.form.get('cal_contratante3', type=int)

        # Crear o actualizar calificación
        calificacion = Calificacion.query.filter_by(servicio_id=servicio.id_servicio, usuario_id=current_user.id_usuario).first()
        if not calificacion:
            calificacion = Calificacion(servicio_id=servicio.id_servicio, usuario_id=current_user.id_usuario)
            db.session.add(calificacion)

        calificacion.calificacion_recived_contratante1 = cal1
        calificacion.calificacion_recived_contratante2 = cal2
        calificacion.calificacion_recived_contratante3 = cal3
        db.session.commit()

        flash("Calificación guardada correctamente.", "success")
    except Exception as e:
        logger.exception("Error al calificar al contratante.")
        flash("Hubo un error al procesar la calificación.", "error")

    return redirect(url_for('dashboard.vigent_contracts'))