import sys
from flask import Flask
from flask_login import LoginManager
from flask_migrate import Migrate
from src.models.database import db, init_app  # Asegúrate de importar el init_app

# Otros imports de tus controladores
from src.controllers.main_controller import main_bp
from src.controllers.auth_controller import auth_bp
from src.controllers.register_controller import register_bp
from src.controllers.search_controller import search_bp
from src.controllers.profile_controller import profile_bp
from src.controllers.loged_controller import loged_bp
from TRAYECTORIA_Python_mvc.src.controllers.send_controller import notifications_bp
from src.controllers.recive_notifications import recive_notifications_bp
from src.models.usuarios import Usuario  # Asegúrate de importar tu modelo de usuario

# Inicialización de LoginManager
login_manager = LoginManager()

def create_app():
    print("Inicializando la aplicación Flask")

    app = Flask(__name__)
    print("Flask app creada")

    # Configuración de la clave secreta
    app.config['SECRET_KEY'] = 'tu_clave_secreta_segura'
    print("Clave secreta configurada")

    # Inicializar la base de datos y migraciones
    try:
        print("Intentando inicializar la base de datos...")
        init_app(app)
        print("Base de datos y migración inicializadas correctamente")
    except Exception as e:
        print(f"Error inicializando la base de datos: {e}", file=sys.stderr)
        raise  # Permitir que el error detenga la ejecución

    # Inicializar LoginManager
    print("Inicializando LoginManager...")
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    print("Login Manager inicializado")

    # Registrar el user_loader
    @login_manager.user_loader
    def load_user(id_usuario):
        return Usuario.query.get(int(id_usuario))

    # Registrar blueprints
    print("Registrando blueprints...")
    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(register_bp, url_prefix='/register')
    app.register_blueprint(search_bp, url_prefix='/search')
    app.register_blueprint(profile_bp, url_prefix='/profile')
    app.register_blueprint(loged_bp, url_prefix='/loged')
    app.register_blueprint(notifications_bp, url_prefix='/notifications')
    app.register_blueprint(recive_notifications_bp, url_prefix='/recive')
    print("Blueprints registrados correctamente")

    return app
