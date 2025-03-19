import logging
from flask import Blueprint, render_template, flash, redirect, url_for, request
from flask_login import current_user, login_required
from src.models.servicio import Servicio
from src.models.calificacion import Calificacion
from src.models.database import db
from sqlalchemy import or_, and_
from src.models.aditional_services import AditionalService

# Configuración del logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
ch.setFormatter(formatter)
logger.addHandler(ch)


# Función reutilizable
def calcular_total_servicios():
    # Inicializa el contador con el servicio principal
    total_services = 1 if current_user.labor else 0

    # Contar servicios adicionales desde AditionalService
    additional_services = AditionalService.query.filter_by(id_usuario=current_user.id_usuario).count()
    total_services += additional_services

    return total_services

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
@dashboard_bp.route('/vigent_contracts/<string:role>', methods=['GET'])
@login_required
def vigent_contracts(role):
    try:
        # Verificar si el rol es válido
        if role not in ['contratante', 'contratado']:
            flash("Rol inválido seleccionado.", "error")
            return redirect(url_for('dashboard.dashboard'))

        # Obtener contratos según el rol seleccionado
        if role == 'contratante':
            contracts = Servicio.query.filter_by(id_contratante=current_user.id_usuario).all()
        else:  # role == 'contratado'
            contracts = Servicio.query.filter_by(id_contratado=current_user.id_usuario).all()

        # Añadir el nombre de la persona a calificar
        contracts_with_names = []
        for contract in contracts:
            if role == 'contratante':
                # Si el usuario es contratante, califica al contratado
                person_to_rate = contract.contratado.nombre if contract.contratado else "No definido"
            elif role == 'contratado':
                # Si el usuario es contratado, califica al contratante
                person_to_rate = contract.contratante.nombre if contract.contratante else "No definido"

            contracts_with_names.append({
                'id_servicio': contract.id_servicio,
                'nombre_servicio': contract.nombre_servicio,
                'fecha_inicio': contract.fecha_inicio,
                'fecha_fin': contract.fecha_fin,
                'person_to_rate': person_to_rate  # Nombre dinámico para el botón
            })

        # Log de depuración
        logger.debug(f"Contratos procesados para {role}: {contracts_with_names}")

        # Renderizar la página con contratos y nombres
        return render_template(
            'vigent_contracts.html',
            contracts=contracts_with_names,
            role=role
        )
    except Exception as e:
        logger.exception("Error al obtener los contratos vigentes.")
        flash("Hubo un error al cargar los contratos vigentes.", "error")
        return redirect(url_for('dashboard.dashboard'))

@dashboard_bp.route('/offered_service', methods=['GET'])
@login_required
def service_count_offered():
    try:
        total_services = calcular_total_servicios()
        logger.debug(f"✅ Total de servicios calculados: {total_services}")
        return {"services_offered": total_services}, 200
    except Exception as e:
        logger.exception(f"Error al contar los servicios ofertados: {e}")
        return {"error": "Ocurrió un error al procesar la solicitud."}, 500


@dashboard_bp.route('/offered_service_page', methods=['GET'])
@login_required
def offered_service_page():
    try:
        total_services = calcular_total_servicios()
        logger.debug(f"Renderizando HTML con total_services={total_services}")
        return render_template('offered_service.html', services_offered=total_services)
    except Exception as e:
        logger.exception(f"Error al renderizar offered_service.html: {e}")
        flash("Hubo un error al cargar la página.", "error")
        return redirect(url_for('dashboard.dashboard'))


@dashboard_bp.route('/edit_service_page', methods=['GET'])
@login_required
def edit_service_page():
    try:
        # Servicio principal del usuario
        principal_service = current_user.labor

        # Otros servicios asociados al usuario (desde AditionalService)
        other_services = AditionalService.query.filter_by(id_usuario=current_user.id_usuario).all()

        logger.debug(f"Servicios adicionales encontrados: {[s.nombre_servicio for s in other_services]}")

        # Renderizar la página y pasar los datos
        return render_template(
            'edit_services.html',
            principal_service=principal_service,
            other_services=other_services
        )
    except Exception as e:
        logger.exception("Error al cargar la página de edición de servicios.")
        flash("Hubo un error al cargar la página.", "error")
        return redirect(url_for('dashboard.dashboard'))


@dashboard_bp.route('/update_other_service/<int:service_id>', methods=['POST'])
@login_required
def update_other_service(service_id):
    try:
        # Obtener datos enviados desde el frontend
        data = request.get_json()
        logger.debug(f"Datos recibidos para actualizar servicio {service_id}: {data}")

        # Buscar el servicio asociado al usuario actual
        service = AditionalService.query.filter_by(id_service=service_id, id_usuario=current_user.id_usuario).first()

        if service:
            # Actualizar solo los campos que están presentes en `data`
            if 'service_name' in data and data['service_name']:
                service.nombre_servicio = data['service_name']
            if 'description' in data and data['description']:
                service.descripcion = data['description']
            if 'category' in data and data['category']:
                service.categoria = data['category']
            if 'price' in data and data['price'] is not None:
                service.precio = float(data['price'])

            # Guardar los cambios
            db.session.commit()
            logger.debug(f"Servicio actualizado con éxito: {service}")
            return {"message": "Servicio actualizado con éxito."}, 200
        else:
            return {"error": "El servicio no existe o no pertenece al usuario."}, 400
    except Exception as e:
        logger.exception("Error al actualizar el servicio adicional.")
        return {"error": "Hubo un problema al actualizar el servicio adicional."}, 500

@dashboard_bp.route('/delete_principal_service', methods=['DELETE'])
@login_required
def delete_principal_service():
    try:
        current_user.labor = None  # Elimina el servicio principal
        db.session.commit()
        logger.debug(f"Servicio principal eliminado para el usuario {current_user.id_usuario}")
        return {"message": "Servicio principal eliminado con éxito."}, 200
    except Exception as e:
        logger.exception("Error al eliminar el servicio principal.")
        return {"error": "Hubo un problema al eliminar el servicio principal."}, 500


@dashboard_bp.route('/delete_other_service/<int:service_id>', methods=['DELETE'])
@login_required
def delete_other_service(service_id):
    try:
        logger.debug(f"Intentando eliminar el servicio con ID: {service_id}")

        # Buscar el servicio adicional en AditionalService
        service = AditionalService.query.filter_by(id_service=service_id, id_usuario=current_user.id_usuario).first()

        if service:
            logger.debug(f"Servicio encontrado: {service.nombre_servicio}. Procediendo a eliminar.")
            db.session.delete(service)
            db.session.commit()
            logger.debug(f"Servicio adicional con ID {service_id} eliminado.")
            return {"message": "Servicio adicional eliminado con éxito."}, 200
        else:
            logger.warning(f"Servicio con ID {service_id} no encontrado o no pertenece al usuario.")
            return {"error": "El servicio no existe o no pertenece al usuario."}, 400
    except Exception as e:
        logger.exception("Error al eliminar el servicio adicional.")
        return {"error": "Hubo un problema al eliminar el servicio adicional."}, 500


@dashboard_bp.route('/new_service_page', methods=['GET', 'POST'])
@login_required
def new_service_page():
    if request.method == 'POST':
        try:
            # Obtener los datos del formulario
            nombre_servicio = request.form.get('nombre_servicio')
            descripcion = request.form.get('descripcion')
            categoria = request.form.get('categoria')
            precio = request.form.get('precio')

            # Validar los datos obligatorios
            if not nombre_servicio:
                flash("El nombre del servicio es obligatorio.", "error")
                return redirect(url_for('dashboard.new_service_page'))

            # Crear el nuevo servicio
            nuevo_servicio = AditionalService(
                id_usuario=current_user.id_usuario,
                nombre_servicio=nombre_servicio,
                descripcion=descripcion,
                categoria=categoria,
                precio=float(precio) if precio else None
            )

            # Guardar en la base de datos
            db.session.add(nuevo_servicio)
            db.session.commit()

            flash("Servicio agregado exitosamente.", "success")
            return redirect(url_for('dashboard.dashboard'))

        except Exception as e:
            db.session.rollback()
            logger.exception("Error al agregar un nuevo servicio.")
            flash("Hubo un error al agregar el servicio.", "error")
            return redirect(url_for('dashboard.new_service_page'))

    # Renderizar el formulario
    return render_template('new_service.html')

@dashboard_bp.route('/contratos_vigentes_roles', methods=['GET'])
@login_required
def contratos_vigentes_roles():
    try:
        # Obtener contratos donde el usuario es contratante o contratado
        contracts = Servicio.query.filter(
            or_(
                Servicio.id_contratante == current_user.id_usuario,
                Servicio.id_contratado == current_user.id_usuario
            )
        ).all()

        # Procesar contratos para determinar roles y evitar duplicados
        contracts_with_roles = []
        seen_contracts = set()  # Evitar duplicados

        for contract in contracts:
            if contract.id_servicio in seen_contracts:
                continue  # Ignorar contratos duplicados

            # Determinar el rol del usuario en el contrato
            if contract.id_contratante == current_user.id_usuario:
                role = 'contratante'
            elif contract.id_contratado == current_user.id_usuario:
                role = 'contratado'
            else:
                continue

            # Agregar contrato con rol al resultado
            contracts_with_roles.append({
                'id_servicio': contract.id_servicio,
                'nombre_servicio': contract.nombre_servicio,
                'fecha_inicio': contract.fecha_inicio,
                'fecha_fin': contract.fecha_fin,
                'role': role
            })

            seen_contracts.add(contract.id_servicio)  # Registrar contrato procesado

        # Log para depuración
        logger.debug(f"Contratos vigentes procesados con roles: {contracts_with_roles}")

        # Renderizar la página de contratos vigentes con roles
        return render_template('contratos_vigentes.html', contracts=contracts_with_roles)
    except Exception as e:
        logger.exception("Error al cargar los contratos vigentes con roles.")
        flash("Hubo un problema al cargar tus contratos vigentes.", "error")
        return redirect(url_for('dashboard.dashboard'))