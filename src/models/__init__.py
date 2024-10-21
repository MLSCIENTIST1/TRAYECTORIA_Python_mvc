import configparser
import psycopg2
from sqlalchemy import create_engine, exc
from sqlalchemy.orm import sessionmaker
from src.models.base import Base  # Importar Base desde base.py

# Leer configuraciones desde el archivo database.conf
config = configparser.ConfigParser()
config.read(r'C:\Users\carlo\Desktop\proyecto sena\TRAYECTORIA_Python_mvc\src\models\database.conf')

print(f"Secciones encontradas: {config.sections()}")  # Depuración

host = config['database']['host']
user = config['database']['user']
password = config['database']['password']
new_database = 'Trayectoria'

# Conexión para crear la nueva base de datos si no existe
conn = psycopg2.connect(
    dbname='postgres',
    user=user,
    password=password,
    host=host
)
conn.autocommit = True
cur = conn.cursor()

try:
    cur.execute(f"CREATE DATABASE {new_database}")
    print(f"Base de datos {new_database} creada.")
except psycopg2.errors.DuplicateDatabase:
    print(f"La base de datos {new_database} ya existe.")
finally:
    conn.close()

# URL de conexión para la nueva base de datos
DATABASE_URL = f"postgresql://{user}:{password}@{host}/{new_database}"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Importar el modelo después de definir Base
from src.models.calificacion import Calificacion

Base.metadata.create_all(bind=engine)

print((f"Tablas sincronizadas en {DATABASE_URL}"))