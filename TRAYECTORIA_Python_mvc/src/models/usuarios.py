import bcrypt
from sqlalchemy import Column, Integer, String, BigInteger, Boolean
from sqlalchemy.orm import relationship
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
    contrasenia = Column(String, nullable=False)  # Almacena el hash de la contraseña
    labor = Column(String, nullable=False)
    cedula = Column(BigInteger, nullable=False, unique=True)
    celular = Column(BigInteger, nullable=False)
    ciudad = Column(String, nullable=False)
    active = Column(Boolean, default=True)

    # Relaciones
    received_notifications = relationship("Notification", foreign_keys='Notification.user_id', back_populates='receiver')
    sent_notifications = relationship("Notification", foreign_keys='Notification.sender_id', back_populates='sender')
    servicios = relationship("Servicio", secondary=usuario_servicio, back_populates="usuarios", lazy='select')
    calificaciones = relationship("Calificacion", back_populates="usuario", cascade="all, delete-orphan")
    servicios_como_contratante = relationship("Servicio", foreign_keys="[Servicio.id_contratante]", back_populates="contratante")
    servicios_como_contratado = relationship("Servicio", foreign_keys="[Servicio.id_contratado]", back_populates="contratado")

    def __init__(self, nombre, apellidos, correo, labor, cedula, celular, ciudad):
        """
        Constructor de la clase Usuario. La contraseña debe ser establecida usando set_password.
        """
        self.nombre = nombre
        self.apellidos = apellidos
        self.correo = correo
        self.labor = labor
        self.cedula = cedula
        self.celular = celular
        self.ciudad = ciudad

    # Métodos para manejar contraseñas
    def set_password(self, password):
        """
        Genera un hash seguro para la contraseña usando bcrypt.
        """
        salt = bcrypt.gensalt()  # Genera un salt único
        self.contrasenia = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')  # Genera el hash y lo guarda

    def check_password(self, password):
        """
        Verifica si la contraseña proporcionada coincide con el hash almacenado.
        """
        return bcrypt.checkpw(password.encode('utf-8'), self.contrasenia.encode('utf-8'))  # Compara el hash

    def get_id(self):
        """
        Retorna el identificador del usuario para Flask-Login.
        """
        return str(self.id_usuario)

    def __repr__(self):
        """
        Representación del objeto Usuario como cadena de texto.
        """
        return f"<Usuario {self.correo}>"