from flask_sqlalchemy import SQLAlchemy

from flask_migrate import Migrate

migrate = Migrate

# Crear una instancia de SQLAlchemy
db = SQLAlchemy()

def init_db(app):
    # Configura la base de datos en la aplicación Flask
    db.init_app(app)

    # Si deseas crear todas las tablas en la base de datos (si no existen)
    with app.app_context():
        db.create_all()