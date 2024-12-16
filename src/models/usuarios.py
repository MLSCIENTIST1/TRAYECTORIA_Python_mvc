from sqlalchemy import Column, Integer, String, BigInteger
from sqlalchemy.orm import relationship
from werkzeug.security import generate_password_hash, check_password_hash
from src.models.database import db
from flask_login import UserMixin
# Importa 'Servicio' aquí, al final de las importaciones
from src.models.servicio import Servicio  # Asegúrate de importar correctamente la clase 'Servicio'
from src.models.usuario_servicio import usuario_servicio  
class Usuario(db.Model, UserMixin):
    __tablename__ = "usuario"

    # Definición de columnas
    id_usuario = Column(Integer, primary_key=True)
    nombre = Column(String, nullable=False)
    apellidos = Column(String, nullable=False)
    correo = Column(String, nullable=False, unique=True)
    contrasenia = Column(String, nullable=False)
    labor = Column(String, nullable=False)
    cedula = Column(BigInteger, nullable=False)
    celular = Column(BigInteger, nullable=False)
    ciudad = Column(String, nullable=False)

    # Relación con servicios
    servicios = relationship("Servicio", secondary=usuario_servicio, back_populates="usuarios")
    notifications = relationship("Notification", backref="usuario", lazy=True)

    def __init__(self, nombre, apellidos, correo, contrasenia, labor, cedula, celular, ciudad):
        self.nombre = nombre
        self.apellidos = apellidos
        self.correo = correo
        self.set_password(contrasenia)
        self.labor = labor
        self.cedula = cedula
        self.celular = celular
        self.ciudad = ciudad 

    # Métodos para manejar contraseñas
    def set_password(self, password):
        self.contrasenia = generate_password_hash(password, method='pbkdf2:sha256')

    def check_password(self, password):
        return check_password_hash(self.contrasenia, password)

    def get_id(self):
        return str(self.id_usuario)

    # CRUD
    def crear(self, session):
        if session.query(Usuario).filter_by(correo=self.correo).first():
            raise ValueError("El correo ya está registrado.")
        session.add(self)
        session.commit()

    @staticmethod
    def leer(session, id_usuario):
        return session.query(Usuario).filter_by(id_usuario=id_usuario).first()

    def actualizar(self, session, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)
        session.commit()

    @staticmethod
    def eliminar(session, id_usuario):
        usuario = session.query(Usuario).filter_by(id_usuario=id_usuario).first()
        if usuario:
            session.delete(usuario)
            session.commit()

    def get_id(self):
        """Especifica que el ID del usuario es `id_usuario`."""
        return str(self.id_usuario) 