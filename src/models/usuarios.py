from sqlalchemy import Column, Integer, String, BigInteger
from sqlalchemy.orm import relationship

from src.models.calificacion import Calificacion
from src.models.usuario_servicio import usuario_servicio

from src.models.database import db 
from flask_login import UserMixin

class Usuario(db.Model, UserMixin):
    
    __tablename__ = "usuario"

    # Definir las columnas para la tabla `usuarios`
    id_usuario = Column(Integer, primary_key=True)
    nombre = Column(String, nullable=False)
    apellidos = Column(String, nullable=False)
    correo = Column(String, nullable=False)
    contrasenia = Column(String, nullable=False)
    labor = Column(String, nullable=False)
    cedula = Column(BigInteger, nullable=False)
    celular = Column(BigInteger, nullable=False)
    ciudad = Column(String,nullable=False)

    # Relaciones con otras tablasa
    calificaciones = relationship("Calificacion", back_populates="usuario")
    servicios = relationship("Servicio", secondary=usuario_servicio, back_populates="usuarios")

    # Constructor de la clase `Usuario`
    def __init__(self, nombre, apellidos, correo, contrasenia, labor, cedula, celular, ciudad):
        self.nombre = nombre
        self.apellidos = apellidos
        self.correo = correo
        self.contrasenia = contrasenia
        self.labor = labor
        self.cedula = cedula
        self.celular = celular
        self.ciudad = ciudad 

    # Método para crear un nuevo usuario y guardar en la base de datos
    def crear(self, session):
        session.add(self)
        session.commit()

    # Método estático para leer un usuario por `id_usuario`
    @staticmethod
    def leer(session, id_usuario):
        return session.query(Usuario).filter_by(id_usuario=id_usuario).first()

    # Método para actualizar un usuario con los nuevos datos
    def actualizar(self, session, nombre=None, apellidos=None, correo=None, contrasenia=None, labor=None, cedula=None, ciudad=None):
        if nombre:
            self.nombre = nombre
        if apellidos:
            self.apellidos = apellidos
        if correo:
            self.correo = correo
        if contrasenia:
            self.contrasenia = contrasenia
        if labor:
            self.labor = labor
        if cedula:
            self.cedula = cedula
        if ciudad:
            self.ciudad =ciudad
        session.commit()

    # Método estático para eliminar un usuario por `id_usuario`
    @staticmethod
    def eliminar(session, id_usuario):
        usuario = session.query(Usuario).filter_by(id_usuario=id_usuario).first()
        if usuario:
            session.delete(usuario)
            session.commit()

    
    
    
    def get_id(self):
        return str(self.id_usuario)