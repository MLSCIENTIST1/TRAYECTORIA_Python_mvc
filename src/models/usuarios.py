from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from src.models.base import Base, db
from src.models.calificacion import Calificacion
from src.models.usuario_servicio import usuario_servicio



class Usuario(db.Model):
    __tablename__ = "usuario"
    id_usuario = Column(Integer, primary_key=True)
    nombre = Column(String, nullable=False)
    apellidos = Column(String, nullable=False)
    correo = Column(String, nullable=False)
    contrasenia = Column(String, nullable=False)
    labor = Column(String, nullable=False)
    cedula = Column(Integer, nullable=False)
    celular = Column(Integer,nullable=False)

    calificaciones = relationship("Calificacion", back_populates="usuario")
    servicios = relationship("Servicio", secondary=usuario_servicio, back_populates="usuarios")

    def __init__(self, nombre, apellidos, correo, contrasenia, labor, cedula,celular):
        self.nombre = nombre
        self.apellidos = apellidos
        self.correo = correo
        self.contrasenia = contrasenia
        self.labor = labor
        self.cedula = cedula
        self.celular= celular

    # Método CRUD para crear un nuevo usuario
    def crear(self, session):
        session.add(self)
        session.commit()

    # Método CRUD para leer un usuario por ID
    @staticmethod
    def leer(session, id_usuario):
        return session.query(Usuario).filter_by(id_usuario=id_usuario).first()

    # Método CRUD para actualizar un usuario
    def actualizar(self, session, nombre=None, apellidos=None, correo=None, contrasenia=None, labor=None, cedula=None):
        if nombre: self.nombre = nombre
        if apellidos: self.apellidos = apellidos
        if correo: self.correo = correo
        if contrasenia: self.contrasenia = contrasenia
        if labor: self.labor = labor
        if cedula: self.cedula = cedula
        session.commit()

    # Método CRUD para eliminar un usuario
    @staticmethod
    def eliminar(session, id_usuario):
        usuario = session.query(Usuario).filter_by(id_usuario=id_usuario).first()
        if usuario:
            session.delete(usuario)
            session.commit()