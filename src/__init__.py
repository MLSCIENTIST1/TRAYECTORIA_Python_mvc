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
from sqlalchemy import or_

migrate = Migrate()

def create_app():
    # Crear la instancia de la aplicación
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'tu_clave_secreta_segura'

    # Configuración de la base de datos (leer desde archivo de configuración)
    config = configparser.ConfigParser()
    config_path = r'C:\Users\carlo\Desktop\proyecto sena\TRAYECTORIA_Python_mvc\src\models\database.conf'

    # Verifica la ruta del archivo de configuración
    print(f"Ruta del archivo de configuración: {config_path}")

    # Cargar el archivo de configuración
    config.read(config_path)

    # Verifica si el archivo se cargó correctamente
    if not config.read(config_path):
        raise ValueError(f"El archivo de configuración no se pudo leer desde la ruta: {config_path}")
    
    # Verifica las secciones disponibles en el archivo de configuración
    print("Secciones encontradas en el archivo de configuración:", config.sections())

    # Verifica si la sección 'database' existe
    if 'database' not in config.sections():
        raise ValueError("El archivo de configuración no contiene la sección 'database'. Secciones disponibles: {}".format(config.sections()))

    # Depuración: Mostrar el contenido de la sección 'database'
    print("Contenido de 'database' en config:", config['database'])

    # Verifica si la clave 'url' existe en la sección 'database'
    if 'url' not in config['database']:
        raise ValueError("El archivo de configuración no contiene la clave 'url' dentro de la sección 'database'.")
    
    # Establece la URI de la base de datos
    db_url = config['database']['url']
    print(f"Conectando a la base de datos con la URL: {db_url}")
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url
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
        apellidos = StringField('Apellido', validators=[DataRequired()])
        cedula = StringField('Cedula', validators=[DataRequired()])
        correo = StringField('Correo electrónico', validators=[DataRequired(), Email()])
        contrasenia = PasswordField('Contrasenia', validators=[DataRequired()])
        ciudad = StringField('Ciudad', validators=[DataRequired()])
        submit = SubmitField('Registrarse')
        labor = StringField('Labor', validators=[DataRequired()])
        celular = StringField('Celular')

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

    @app.route('/resultado_filtro_primera_busqueda', methods=['GET', 'POST'])
    @login_required
    def resultado_filtro_primera_busqueda():
        
        print("Depuración - Página de edición accedida")
    
        ciudad = request.args.get('ciudad')
        labor = request.args.get('labor')
        
        print(f"Depuración - Ciudad: {ciudad}")
        print(f"Depuración - Labor: {labor}")
        
        query = Usuario.query
        
        # Creamos las condiciones de filtro
        condiciones = []
        
        # Filtrar por ciudad
        if ciudad:
            condiciones.append(Usuario.ciudad == ciudad)
            print(f"Depuración - Filtro aplicado para ciudad: {ciudad}")

        # Filtrar por labor
        if labor:
            condiciones.append(Usuario.labor.ilike(f"%{labor}%"))  # Usamos ilike para insensibilidad a mayúsculas
            print(f"Depuración - Filtro aplicado para labor: {labor}")

        # Si hay condiciones, usamos or_() para aplicarlas
        if condiciones:
            query = query.filter(or_(*condiciones))
        
        # Ejecutar la consulta
        resultados = query.all()

        # Mostrar los resultados
        if resultados:
            print(f"Depuración - Se encontraron {len(resultados)} resultados.")
        else:
            print("Depuración - No se encontraron resultados.")

        return render_template('resultado_filtro_primera_busqueda.html', resultados=resultados)
    
    @app.route('/detalle_resultado_busqueda/<int:user_id>')
    @login_required
    def detalle_resultado_busqueda(user_id):
        usuario = Usuario.query.get(user_id)
        return render_template('detalle_resultado_busqueda.html', usuario = usuario)

        

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
            hashed_password = generate_password_hash(form.contrasenia.data, method='pbkdf2:sha256')
            new_user = Usuario(
                nombre=form.nombre.data,
                apellidos=form.apellidos.data,
                cedula=form.cedula.data,
                correo=form.correo.data,
                contrasenia=hashed_password,
                labor=form.labor.data,
                celular=form.celular.data,
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
        flash('La sesión se ha cerrado exitosamente','info')
        return redirect(url_for('index'))
    
    @app.route('/editando', methods=['GET', 'POST'])
    @login_required
    def editando():
            return render_template('editando.html')
    
    
    """@app.route('/resultados', methods=['GET'])
    def resultados():
        ciudad = request.args.get('ciudad')  # Recibe el valor de ciudad desde la URL
        labor = request.args.get('labor')    # Recibe el valor de labor desde la URL
        #se hace solo la consulta en el modelo usuario
        query = Usuario.query
        # Filtrar servicios por ciudad y/o labor, considerando la relación muchos a muchos
        if ciudad :
            query = query.filter(Usuario.ciudad == ciudad)
            print("Se encontro un resultado para: {ciudad}")

        if labor : 
            query = query.filter(Usuario.labor.like(f"%{labor}%"))
            print("Se encontro un resultado para: {ciudad}")
        
        resultados = query.all()

        # Pasamos los servicios filtrados a la plantilla
        return render_template('resultado_filtro_primera_busqueda.html', resultados=resultados)"""
    
    

    return app  # Devuelve la aplicación creada 