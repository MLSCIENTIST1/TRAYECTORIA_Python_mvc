from flask import Flask, render_template
from src.models import base,
from src.models.calificacion import Calificacion
from src.models.servicio import Servicio
from src.models.usuarios import Usuario


app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/editando')
def editando():
    return render_template('editando.html')

@app.route("/mainpage")
def mainpage():
    return render_template("mainpage.html")

if __name__ == '__main__':
    app.run(debug=True)