import logging
from flask import Blueprint, render_template, flash, redirect, url_for, request
from flask_login import current_user
from src.models.servicio import Servicio
from src.models.calificacion import Calificacion
from src.models.database import db
from sqlalchemy import or_

# Configurar logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
ch.setFormatter(formatter)
logger.addHandler(ch)

# Crear Blueprint para la funcionalidad de calificación
calificar = Blueprint('calificar', __name__)

@calificar.route('/calificar', methods=['GET'])
def show_calificar():
    # Obtener contratos vigentes donde el usuario es contratante o contratado
    contracts = Servicio.query.filter(
        or_(
            Servicio.id_contratante == current_user.id_usuario,
            Servicio.id_contratado == current_user.id_usuario
        )
    ).all()

    # Mostrar contratos en la plantilla
    return render_template('calificar.html', contracts=contracts)

@calificar.route('/rate_contratante/<int:servicio_id>', methods=['POST'])
def rate_contratante(servicio_id):
    try:
        # Obtener el servicio por ID
        servicio = Servicio.query.get_or_404(servicio_id)

        # Validar que el usuario es el contratante
        if servicio.id_contratante != current_user.id_usuario:
            flash("No puedes calificar este servicio porque no eres el contratante.", "error")
            return redirect(url_for('calificar.calificar'))

        # Obtener las calificaciones del formulario
        cal1 = request.form.get('cal_contratante1', type=int)
        cal2 = request.form.get('cal_contratante2', type=int)
        cal3 = request.form.get('cal_contratante3', type=int)

        # Validar que las calificaciones estén en el rango permitido
        if not (1 <= cal1 <= 10 and 1 <= cal2 <= 10 and 1 <= cal3 <= 10):
            flash("Las calificaciones deben estar entre 1 y 10.", "error")
            return redirect(url_for('calificar.calificar'))

        # Crear o actualizar la calificación
        calificacion = Calificacion.query.filter_by(servicio_id=servicio.id_servicio, usuario_id=current_user.id_usuario).first()
        if not calificacion:
            calificacion = Calificacion(
                servicio_id=servicio.id_servicio,
                usuario_id=current_user.id_usuario,
                calificacion_recived_contratante1=cal1,
                calificacion_recived_contratante2=cal2,
                calificacion_recived_contratante3=cal3
            )
            db.session.add(calificacion)
        else:
            calificacion.calificacion_recived_contratante1 = cal1
            calificacion.calificacion_recived_contratante2 = cal2
            calificacion.calificacion_recived_contratante3 = cal3

        # Guardar cambios en la base de datos
        db.session.commit()

        logger.debug(f"Calificación guardada para el servicio {servicio.id_servicio}: cal1={cal1}, cal2={cal2}, cal3={cal3}")
        flash("Calificación guardada correctamente.", "success")
    except Exception as e:
        logger.exception("Error al calificar al contratante.")
        db.session.rollback()
        flash("Hubo un error al procesar la calificación.", "error")

    # Redirigir de vuelta a la página de calificaciones
    return redirect(url_for('calificar.show_calificar'))