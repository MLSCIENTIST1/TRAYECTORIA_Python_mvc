from sqlalchemy import Column, Integer, String, Date, ForeignKey,String, Boolean
from sqlalchemy.orm import relationship
from src.models.usuario_servicio import usuario_servicio  # Se importa la tabla intermedia
from src.models.database import db

class Servicio(db.Model):
    __tablename__ = "servicio"

    # Definición de columnas
    id_servicio = Column(Integer, primary_key=True)
    nombre_servicio = Column(String, nullable=False)
    fecha_solicitud = Column(Date, nullable=False)
    fecha_aceptacion = Column(Date, nullable=False)
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=False)
    nombre_contratante = Column(String, nullable=False)
    aditional_service = Column(String(234), nullable=True)
    service_active= Column(Boolean, default = True)

    id_usuario = db.Column(db.Integer, db.ForeignKey('usuario.id_usuario'), nullable=False)
    id_contratante = Column(Integer, ForeignKey('usuario.id_usuario'), nullable=False)
    id_contratado = Column(Integer, ForeignKey('usuario.id_usuario'), nullable=True)  # Nuevo campo

    contratante = relationship("Usuario", foreign_keys=[id_contratante], back_populates="servicios_como_contratante")
    contratado = relationship("Usuario", foreign_keys=[id_contratado], back_populates="servicios_como_contratado")

    # Relación con usuarios
    usuarios = relationship("Usuario", secondary=usuario_servicio, back_populates="servicios")
    calificaciones = db.relationship("Calificacion", back_populates="servicio")
    #Relaciones con media_storage
    etapas = relationship("Etapa", back_populates="servicio", cascade="all, delete-orphan")
    

    # CRUD
    @classmethod
    def leer(cls, session, id_servicio):
        return session.query(cls).filter_by(id_servicio=id_servicio).first()

    def actualizar(self, session, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)
        session.commit()

    @classmethod
    def eliminar(cls, session, id_servicio):
        servicio = cls.leer(session, id_servicio)
        if servicio:
            session.delete(servicio)
            session.commit()