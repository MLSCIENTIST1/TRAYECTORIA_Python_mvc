from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from src.models.database import db

class Calificacion(db.Model):
    __tablename__ = "calificacion"

    id_calificacion = db.Column(db.Integer, primary_key=True)
    servicio_id = db.Column(db.Integer, db.ForeignKey('servicio.id_servicio', ondelete='CASCADE'), nullable=False)  # Clave foránea correcta
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id_usuario', ondelete='CASCADE'), nullable=False)    # Clave foránea correcta

    calificacion_recived_contratante1 = db.Column(db.Integer, nullable=True)
    calificacion_recived_contratante2 = db.Column(db.Integer, nullable=True)
    calificacion_recived_contratante3 = db.Column(db.Integer, nullable=True)
    calificacion_recived_contratado1 = db.Column(db.Integer, nullable=True)
    calificacion_recived_contratado2 = db.Column(db.Integer, nullable=True)
    calificacion_recived_contratado3 = db.Column(db.Integer, nullable=True)

    puntaje_por_labor = db.Column(db.Integer, nullable=True)
    puntaje_global = db.Column(db.Integer, nullable=True)
    comentario = db.Column(db.String, nullable=True)

    # Relaciones
    usuario = db.relationship("Usuario", back_populates="calificaciones")
    servicio = db.relationship("Servicio", back_populates="calificaciones")