from sqlalchemy import Column, Integer, String, BigInteger
from sqlalchemy.orm import relationship
from werkzeug.security import generate_password_hash, check_password_hash
from src.models.database import db
from flask_login import UserMixin
from src.models.servicio import Servicio
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
    cedula = Column(BigInteger, nullable=False, unique=True)
    celular = Column(BigInteger, nullable=False)
    ciudad = Column(String, nullable=False)

    # Relaciones
    servicios = relationship("Servicio", secondary=usuario_servicio, back_populates="usuarios", lazy='select')
    notifications = relationship("Notification", backref="usuario", lazy='select')

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
        """Hash y almacena la contraseña."""
        self.contrasenia = generate_password_hash(password, method='pbkdf2:sha256')

    def check_password(self, password):
        """Valida la contraseña ingresada."""
        print("password")
        return check_password_hash(self.contrasenia, password)

    def get_id(self):
        return str(self.id_usuario)

    # CRUD
    def crear(self, session):
        """Crea un nuevo usuario."""
        try:
            if session.query(Usuario).filter_by(correo=self.correo).first():
                raise ValueError("El correo ya está registrado.")
            session.add(self)
            session.commit()
        except Exception as e:
            session.rollback()
            raise e

    @staticmethod
    def leer(session, id_usuario):
        """Lee un usuario por ID."""
        return session.query(Usuario).filter_by(id_usuario=id_usuario).first()

    def actualizar(self, session, **kwargs):
        """Actualiza los campos de un usuario."""
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
        session.commit()

    @staticmethod
    def eliminar(session, id_usuario):
        """Elimina un usuario por ID."""
        usuario = session.query(Usuario).filter_by(id_usuario=id_usuario).first()
        if usuario:
            session.delete(usuario)
            session.commit()

    def __repr__(self):
        return f"<Usuario {self.correo}>"