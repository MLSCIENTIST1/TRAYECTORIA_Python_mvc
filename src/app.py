import sys
import os
import configparser
from flask import Flask, render_template, flash, redirect, url_for

# Ajustar el path del sistema
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + "/..")

# Importar formularios y modelos
from views.forms import LoginForm, RegisterForm
from src.models import db, init_app
from src.models.usuarios import Usuario
from src.models.servicio import Servicio
from src.models.usuario_servicio import usuario_servicio 
from src.models.calificacion import Calificacion

# Crear la aplicación Flask
app = Flask(__name__)
app.config['SECRET_KEY'] = 'mysecret'  # Clave secreta para la sesión

config = configparser.ConfigParser() 
config.read(r'C:\Users\carlo\Desktop\proyecto sena\TRAYECTORIA_Python_mvc\src\models\database.conf') 
app.config['SQLALCHEMY_DATABASE_URI'] = f"postgresql://{config['database']['user']}:{config['database']['password']}@{config['database']['host']}:{config['database']['port']}/{config['database']['database']}"

# Configurar la base de datos
init_app(app)

@app.before_request
def setup_database():
    # Crear todas las tablas antes del primer request
    with app.app_context():
        db.create_all()

@app.route('/', methods=['GET', 'POST'])
def index():
    form = LoginForm()
    if form.validate_on_submit():
        user = Usuario.query.filter_by(correo=form.email.data).first()
        if user and user.contrasenia == form.password.data:
            flash('Inicio de sesión exitoso', 'success')
            return redirect(url_for('mainpage'))
        else:
            flash('Correo o contraseña incorrectos', 'danger')
    return render_template('index.html', form=form)

@app.route('/register', methods=['GET', 'POST'])
def register():
    form = RegisterForm()
    if form.validate_on_submit():
        nuevo_usuario = Usuario(
            nombre=form.nombre.data,
            apellidos=form.apellidos.data,
            correo=form.correo.data,
            contrasenia=form.password.data,
            labor=form.labor.data,
            cedula=form.cedula.data,
            celular=form.celular.data
        )
        db.session.add(nuevo_usuario)
        db.session.commit()
        flash('Registro exitoso', 'success')
        return redirect(url_for('mainpage'))
    return render_template('register.html', form=form)

@app.route('/editando')
def editando():
    return render_template('editando.html')

@app.route("/mainpage")
def mainpage():
    return render_template('mainpage.html')  

if __name__ == '__main__':
    app.run(debug=True)  # Ejecutar la aplicación en modo de depuración