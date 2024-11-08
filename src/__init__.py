from flask import Flask, render_template, redirect, url_for, flash, request
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField, SubmitField
from wtforms.validators import DataRequired, Email
from werkzeug.security import generate_password_hash, check_password_hash
from flask_mail import Mail, Message
import configparser
from src.models.usuarios import Usuario
from src.models.database import db
from src.models.servicio import Servicio
from src.models.usuario_servicio import usuario_servicio
from flask_migrate import Migrate

migrate = Migrate()

def create_app():
    # Crear la instancia de la aplicación
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'tu_clave_secreta_segura'

    # Configuración de la base de datos (leer desde archivo de configuración)
    config = configparser.ConfigParser()
    config.read('src/models/database.conf')  # Ajusta la ruta si es necesario
    app.config['SQLALCHEMY_DATABASE_URI'] = config['database']['url']
    db.init_app(app)
    migrate.init_app(app, db)

    # Configuración del correo electrónico (opcional)
    app.config['MAIL_SERVER'] = 'smtp.gmail.com'
    app.config['MAIL_PORT'] = 587
    app.config['MAIL_USE_TLS'] = True
    app.config['MAIL_USERNAME'] = 'tu_correo@gmail.com'
    app.config['MAIL_PASSWORD'] = 'tu_contraseña'
    mail = Mail(app)

    # Configuración de Flask-Login
    login_manager = LoginManager(app)
    login_manager.login_view = 'login'

    # Depuración: Mensajes dentro del user_loader
    @login_manager.user_loader
    def load_user(user_id):
        print(f"Depuración - Cargando usuario con id: {user_id}")
        user = Usuario.query.filter_by(id_usuario=int(user_id)).first()
        if user:
            print(f"Depuración - Usuario encontrado: {user.nombre} (ID: {user.id_usuario})")
        else:
            print("Depuración - No se encontró usuario con ese ID.")
        return user

    # Formularios
    class LoginForm(FlaskForm):
        email = StringField('Correo electrónico', validators=[DataRequired(), Email()])
        password = PasswordField('Contraseña', validators=[DataRequired()])
        remember = BooleanField('Recordar sesión')
        submit = SubmitField('Iniciar sesión')

    class RegisterForm(FlaskForm):
        nombre = StringField('Nombre', validators=[DataRequired()])
        correo = StringField('Correo electrónico', validators=[DataRequired(), Email()])
        password = PasswordField('Contraseña', validators=[DataRequired()])
        ciudad = StringField('Ciudad', validators=[DataRequired()])
        submit = SubmitField('Registrarse')

    # Rutas
    @app.route('/')
    def index():
        if current_user.is_authenticated:
            print("Depuración - Usuario ya está autenticado, redirigiendo a editando.")
            return redirect(url_for('editando'))
        return render_template('index.html')

    @app.route('/login', methods=['GET', 'POST'])
    def login():
        if current_user.is_authenticated:  # Verificar si el usuario ya está logueado
            print("Depuración - Usuario ya está autenticado, redirigiendo a editando.")
            return redirect(url_for('editando'))  # Redirigir si ya está logueado

        form = LoginForm()
        if form.validate_on_submit():
            print("Depuración - Formulario de login enviado correctamente!")
            print("Email proporcionado:", form.email.data)  # Verifica el email recibido
            print("Contraseña proporcionada (en texto plano):", form.password.data)  # Verifica la contraseña

            user = Usuario.query.filter_by(correo=form.email.data).first()
            print(f"Depuración - Buscando usuario con correo: {form.email.data}")
            
            if user:
                print(f"Depuración - Usuario encontrado: {user.nombre}")
                print(f"Depuración - Contraseña guardada en la base de datos (hash): {user.contrasenia}")
                
                # Comparar la contraseña
                if check_password_hash(user.contrasenia, form.password.data):
                    print(f"Depuración - Contraseña correcta, autenticando al usuario {user.nombre}")
                    login_user(user, remember=form.remember.data)
                    flash('¡Inicio de sesión exitoso!', 'success')
                    return redirect(url_for('editando'))
                else:
                    print(f"Depuración - Error: la contraseña proporcionada no coincide con el hash.")
            else:
                print(f"Depuración - No se encontró usuario con el correo: {form.email.data}")
                flash('Correo o contraseña incorrectos', 'danger')

        else:
            print("Depuración - El formulario no pasó la validación.")
            print(f"Errores de validación: {form.errors}")

        return render_template('login.html', form=form)

    @app.route('/editando', methods= ['GET','POST'])
    @login_required
    def editando():
        print("Depuración - Página de edición accedida")
        ciudad = request.args.get('ciudad')
        labor = request.args.get('labor')
        
        # Filtrar los servicios según los parámetros recibidos
        if ciudad and labor:
            servicios_filtrados = Servicio.query.filter(Servicio.ciudad == ciudad, Servicio.labor == labor).all()
        elif ciudad:
            servicios_filtrados = Servicio.query.filter(Servicio.ciudad == ciudad).all()
        elif labor:
            servicios_filtrados = Servicio.query.filter(Servicio.labor == labor).all()
        else:
            servicios_filtrados = Servicio.query.all()  # Si no se proporciona filtro, mostrar todos los servicios

        return render_template('editando.html', servicios=servicios_filtrados)

    @app.route('/register', methods=['GET', 'POST'])
    def register():
        form = RegisterForm()
        if form.validate_on_submit():
            # Verificar si el correo ya está registrado
            existing_user = Usuario.query.filter_by(correo=form.correo.data).first()
            if existing_user:
                flash('Ya existe una cuenta con ese correo.', 'danger')
                return redirect(url_for('register'))

            # Crear nuevo usuario
            hashed_password = generate_password_hash(form.password.data, method='sha256')
            new_user = Usuario(
                nombre=form.nombre.data,
                correo=form.correo.data,
                contrasenia=hashed_password,
                ciudad=form.ciudad.data
            )
            db.session.add(new_user)
            db.session.commit()

            flash('¡Te has autenticado exitosamente! ', 'success')
            return redirect(url_for('login'))

        return render_template('register.html', form=form)

    @app.route('/logout')
    def logout():
        logout_user()
        flash('La sesión se ha cerrado exitosamente', 'info')
        return redirect(url_for('index'))

    @app.route('/filter_services', methods=['GET'])
    
    @app.route('/filter_services', methods=['GET'])
    def filter_services():
        ciudad = request.args.get('ciudad')  # Recibe el valor de ciudad desde la URL
        labor = request.args.get('labor')    # Recibe el valor de labor desde la URL

        # Filtrar servicios por ciudad y/o labor, considerando la relación muchos a muchos
        if ciudad and labor:
            # Filtramos por la ciudad del Usuario y la labor del Servicio
            servicios_filtrados = Servicio.query \
                .join(usuario_servicio) \
                .join(Usuario) \
                .filter(Usuario.ciudad == ciudad, Servicio.nombre_servicio == labor).all()
        elif ciudad:
            # Filtramos solo por la ciudad del Usuario
            servicios_filtrados = Servicio.query \
                .join(usuario_servicio) \
                .join(Usuario) \
                .filter(Usuario.ciudad == ciudad).all()
        elif labor:
            # Filtramos solo por la labor del Servicio
            servicios_filtrados = Servicio.query \
                .filter(Servicio.nombre_servicio == labor).all()
        else:
            # Si no hay filtros, mostramos todos los servicios
            servicios_filtrados = Servicio.query.all()

        # Pasamos los servicios filtrados a la plantilla
        return render_template('filter_services.html', servicios=servicios_filtrados)

    return app  # Devuelve la aplicación creada