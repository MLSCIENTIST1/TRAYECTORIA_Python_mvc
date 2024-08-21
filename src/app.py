from flask import Flask, render_template

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