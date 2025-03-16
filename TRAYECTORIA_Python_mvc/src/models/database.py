from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import psycopg2
import configparser
import sys

# Crear instancias globales
db = SQLAlchemy()
migrate = Migrate()

# Función para leer la configuración
def read_config(file_path):
    config = configparser.ConfigParser()
    config.read(file_path, encoding='utf-8')
    return config

# Leer las configuraciones desde el archivo `database.conf`
config = read_config(r'C:\Users\carlo\Desktop\proyecto_sena\TRAYECTORIA_Python_mvc\src\models\database.conf')
host = config['database']['host']
user = config['database']['user']
password = config['database']['password']
database = config['database']['database']

# URL de la base de datos
DATABASE_URL = f"postgresql://{user}:{password}@{host}/{database}"

# Probar conexión a la base de datos
try:
    engine = psycopg2.connect(DATABASE_URL)
    print("Conexión exitosa a la base de datos")
except Exception as e:
    print(f"Error al conectar a la base de datos: {e}")

# Crear la base de datos si no existe
def create_database():
    print("Conectando a la base de datos postgres...")
    conn = None
    cur = None
    try:
        conn = psycopg2.connect(
            dbname='postgres',
            user=user,
            password=password,
            host=host,
            options='-c client_encoding=UTF8'
        )
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", [database])
        if not cur.fetchone():
            cur.execute(f"CREATE DATABASE {database}")
            print(f"Base de datos '{database}' creada.")
        else:
            print(f"La base de datos '{database}' ya existe.")
    except Exception as e:
        print(f"Error al crear la base de datos: {e}", file=sys.stderr)
    finally:
        if cur is not None:
            cur.close()
        if conn is not None:
            conn.close()

# Inicializar la aplicación
def init_app(app):
    app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    migrate.init_app(app, db)
    print("Base de datos y migraciones inicializadas correctamente")