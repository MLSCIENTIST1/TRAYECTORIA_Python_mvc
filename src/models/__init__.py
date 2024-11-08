import configparser
import psycopg2
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine, exc
from flask import Flask
from src.models.database import db, init_db
import create_app

# Inicialización de SQLAlchemy
db = SQLAlchemy()

# Función para verificar y leer el archivo de configuración
def read_config(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        config = configparser.ConfigParser()
        config.read_file(f)
    return config

# Leer configuraciones desde el archivo database.conf
config = read_config(r'C:\Users\carlo\Desktop\proyecto sena\TRAYECTORIA_Python_mvc\src\models\database.conf')
print(f"Secciones encontradas: {config.sections()}")  # Depuración

host = config['database']['host']
user = config['database']['user']
password = config['database']['password']
database = config['database']['database']

# Verifica y crea la base de datos si no existe
def create_database():
    conn = psycopg2.connect(
        dbname='postgres',
        user=user,
        password=password,
        host=host,
        options='-c client_encoding=UTF8'
    )
    conn.autocommit = True
    cur = conn.cursor()
    try:
        cur.execute(f"CREATE DATABASE {database}")
        print(f"Base de datos {database} creada.")
    except psycopg2.errors.DuplicateDatabase:
        print(f"La base de datos {database} ya existe.")
    finally:
        conn.close()

# Llamar una vez para asegurarse de que la base de datos existe
create_database()

# URL de conexión para la base de datos
DATABASE_URL = f"postgresql://{user}:{password}@{host}/{database}"

# Configurar la conexión para SQLAlchemy
def init_app(app:Flask):
    
    db.init_app(app)

# Importar modelos después de inicializar `db`
from src.models.usuarios import Usuario
from src.models.calificacion import Calificacion
from src.models.servicio import Servicio
from src.models.usuario_servicio import usuario_servicio