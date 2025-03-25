from flask_restful import Resource
from flask import request, jsonify
from flask_cors import cross_origin
from src.models.servicio import Servicio
from src.models.database import db  

class CreateServiceAPI(Resource):
    @cross_origin()
    def post(self):
        try:
            # Leer los datos del cuerpo de la solicitud
            data = request.get_json()

            # Crear una instancia del modelo Servicio
            servicio = Servicio(
                nombre_servicio=data["nombre_servicio"],
                fecha_solicitud=data["fecha_solicitud"],
                fecha_aceptacion=data["fecha_aceptacion"],
                fecha_inicio=data["fecha_inicio"],
                fecha_fin=data["fecha_fin"],
                nombre_contratante=data["nombre_contratante"],
                id_contratante=data["id_contratante"],
                id_usuario=data["id_usuario"]
            )

            # Guardar el servicio en la base de datos
            db.session.add(servicio)
            db.session.commit()

            # Retornar una respuesta exitosa
            return jsonify({"message": "Servicio creado exitosamente", "servicio_id": servicio.id_servicio})

        except Exception as e:
            # Manejo de errores
            db.session.rollback()
            return jsonify({"error": str(e)}), 500