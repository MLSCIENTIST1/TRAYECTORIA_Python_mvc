import logging
from flask import Blueprint, render_template, flash, redirect, url_for, request
from flask_login import current_user
from src.models.servicio import Servicio
from src.models.calificacion import Calificacion
from src.models.database import db
from sqlalchemy import or_, and_

# Configuración del logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
ch.setFormatter(formatter)
logger.addHandler(ch)

dashboard_bp = Blueprint('dashboard', __name__)
import logging
from flask import Blueprint, render_template, flash, redirect, url_for, request
from flask_login import current_user
from src.models.servicio import Servicio
from src.models.calificacion import Calificacion
from src.models.database import db
from sqlalchemy import or_, and_

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
        logger.debug(f"Cantidad de contratos actuales como contratante: {contract_count_contratante}")

        # Contar contratos vigentes donde el usuario es contratado
        contract_count_contratado = Servicio.query.filter_by(id_contratado=current_user.id_usuario).count()
        logger.debug(f"Cantidad de contratos actuales como contratado: {contract_count_contratado}")

        # Calificaciones recibidas como contratante
        calification_count_contratante = Calificacion.query.join(Servicio).filter(
            and_(
                Servicio.id_contratante == current_user.id_usuario,
                or_(
                    Calificacion.calificacion_recived_contratante1.isnot(None),
                    Calificacion.calificacion_recived_contratante2.isnot(None),
                    Calificacion.calificacion_recived_contratante3.isnot(None)
                ),
                Calificacion.servicio_id == Servicio.id_servicio
            )
        ).count()
        logger.debug(f"Cantidad de calificaciones recibidas como contratante: {calification_count_contratante}")

        # Calificaciones recibidas como contratado
        calification_count_contratado = Calificacion.query.join(Servicio).filter(
            and_(
                Servicio.id_contratado == current_user.id_usuario,
                or_(
                    Calificacion.calificacion_recived_contratado1.isnot(None),
                    Calificacion.calificacion_recived_contratado2.isnot(None),
                    Calificacion.calificacion_recived_contratado3.isnot(None)
                ),
                Calificacion.servicio_id == Servicio.id_servicio
            )
        ).count()
        logger.debug(f"Cantidad de calificaciones recibidas como contratado: {calification_count_contratado}")

        # Renderizar el template con todos los datos
        return render_template(
            'dashboard.html',
            contract_count_contratante=contract_count_contratante,
            contract_count_contratado=contract_count_contratado,
            calification_count_contratante=calification_count_contratante,
            calification_count_contratado=calification_count_contratado
        )
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
        logger.debug(f"Total contratos vigentes encontrados: {len(contracts)}")

        return render_template('vigent_contracts.html', contracts=contracts, contract_count=len(contracts))
    except Exception as e:
        logger.exception("Error al obtener los contratos vigentes.")
        flash("Hubo un error al cargar los contratos vigentes.", "error")
        return redirect(url_for('dashboard.dashboard'))

