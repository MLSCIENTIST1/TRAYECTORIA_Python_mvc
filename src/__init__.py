import os
import sys
import logging
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
from src.controllers.send_controller import notifications_bp
from src.controllers.recive_notifications import recive_notifications_bp
from src.models.usuarios import Usuario  # Asegúrate de importar tu modelo de usuario

# Inicialización de LoginManager
login_manager = LoginManager()

# Configuración de Logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', handlers=[logging.StreamHandler(sys.stdout), logging.FileHandler('app_startup.log')])
logger = logging.getLogger(__name__)

class Config:
    SECRET_KEY = 'tu_clave_secreta_segura'

def create_app():
    logger.info("Inicializando la aplicación Flask")
    flask_env = os.environ.get('FLASK_ENV')
    logger.info(f"El valor de FLASK_ENV es: {flask_env}")

    app = Flask(__name__)
    

    # Cargar configuración desde la clase Config
    app.config.from_object(Config)
    logger.info("Flask app creada y configuración cargada")

    # Configuración de la clave secreta
    app.config['SECRET_KEY'] = Config.SECRET_KEY
    logger.info("Clave secreta configurada")

    # Configuración de Debug y el entorno
    app.config['ENV'] = 'development'  # Establece el entorno a 'development'
    app.config['DEBUG'] = True  # Activa el modo debug explícitamente

    # Inicializar la base de datos y migraciones
    try:
        logger.info("Intentando inicializar la base de datos...")
        init_app(app)
        logger.info("Base de datos y migración inicializadas correctamente")
    except Exception as e:
        logger.error(f"Error inicializando la base de datos: {e}", exc_info=True)
        raise  # Permitir que el error detenga la ejecución

    # Inicializar LoginManager
    logger.info("Inicializando LoginManager...")
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    logger.info("Login Manager inicializado")

    # Registrar el user_loader
    @login_manager.user_loader
    def load_user(id_usuario):
        logger.debug(f"Intentando cargar el usuario con ID: {id_usuario}")
        return Usuario.query.get(int(id_usuario))

    # Registrar blueprints
    logger.info("Registrando blueprints...")
    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(register_bp, url_prefix='/register')
    app.register_blueprint(search_bp, url_prefix='/search')
    app.register_blueprint(profile_bp, url_prefix='/profile')
    app.register_blueprint(loged_bp, url_prefix='/loged')
    app.register_blueprint(notifications_bp, url_prefix='/notifications')
    app.register_blueprint(recive_notifications_bp, url_prefix='/recive')
    logger.info("Blueprints registrados correctamente")

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)  # Ejecuta la app con debug activado