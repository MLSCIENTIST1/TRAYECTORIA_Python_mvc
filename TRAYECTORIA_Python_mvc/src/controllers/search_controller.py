from flask import Blueprint, render_template, request, url_for
from flask_login import login_required
from src.models.usuarios import Usuario
from sqlalchemy import or_
from src.models.aditional_services import AditionalService
import logging
from src.models.calificacion import Calificacion
from src.models.database import db

# Configurar logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
ch.setFormatter(formatter)
logger.addHandler(ch)

search_bp = Blueprint('search', __name__)

@search_bp.route('/search/resultado_filtro_primera_busqueda', methods=['GET', 'POST'])
@login_required
def resultado_filtro_primera_busqueda():
    ciudad = request.args.get('ciudad')
    labor = request.args.get('labor')
    
    # Consulta de usuarios
    query_usuarios = Usuario.query
    condiciones = []

    if ciudad:
        condiciones.append(Usuario.ciudad == ciudad)
    if labor:
        condiciones.append(Usuario.labor.ilike(f"%{labor}%"))
    if condiciones:
        query_usuarios = query_usuarios.filter(or_(*condiciones))
    usuarios = query_usuarios.all()

    # Consulta de servicios adicionales, excluyendo el servicio principal
    servicios_adicionales = []
    if labor:
        servicios_adicionales = AditionalService.query.filter(
            AditionalService.nombre_servicio.ilike(f"%{labor}%") == False  # Excluir servicios iguales a la labor buscada
        ).all()

    # Combinar resultados por usuario
    resultados = [
        {
            "usuario": usuario,
            "servicios_adicionales": [
                servicio for servicio in servicios_adicionales if servicio.id_usuario == usuario.id_usuario
            ]
        }
        for usuario in usuarios
    ]

    # Debugging para asegurarte de que los servicios adicionales se obtienen correctamente
    logger.debug(f"Usuarios encontrados: {len(usuarios)}")
    logger.debug(f"Servicios adicionales encontrados: {len(servicios_adicionales)}")

    # Renderizar plantilla asegurándose de pasar la estructura de datos correcta
    return render_template('resultado_filtro_primera_busqueda.html', resultados=resultados)

@search_bp.route('/detalle_candidato/<int:id_usuario>', methods=['GET', 'POST'])
@login_required
def detalle_candidato(id_usuario):
    # Buscar al usuario
    usuario = Usuario.query.get_or_404(id_usuario)

    # Verificar si hay un servicio adicional específico
    id_service = request.args.get('id_service')
    servicio = None
    if id_service:
        servicio = AditionalService.query.filter_by(id_service=id_service, id_usuario=id_usuario).first()
        if not servicio:
            flash("El servicio adicional no existe o no pertenece al usuario.", "error")
            return redirect(url_for('search.resultado_filtro_primera_busqueda'))

    # Calcular puntaje en la última labor como contratado
    calificacion = Calificacion.query.filter_by(usuario_id=id_usuario).first()
    puntaje_ultima_labor = None
    if calificacion:
        # Calcular promedio de las calificaciones recibidas como contratado
        calificaciones_contratado = [
            calificacion.calificacion_recived_contratado1,
            calificacion.calificacion_recived_contratado2,
            calificacion.calificacion_recived_contratado3
        ]
        validas = [c for c in calificaciones_contratado if c is not None]
        if len(validas) == 3:  # Solo calcular si existen las 3 calificaciones
            puntaje_ultima_labor = sum(validas) / 3
            # Actualizar la columna puntaje_por_labor en la base de datos
            calificacion.puntaje_por_labor = puntaje_ultima_labor
            db.session.commit()

    # Renderizar la plantilla con los datos del usuario, servicio, y puntaje
    return render_template(
        'detalle_candidato.html',
        usuario=usuario,
        servicio=servicio,
        puntaje_ultima_labor=puntaje_ultima_labor
    )