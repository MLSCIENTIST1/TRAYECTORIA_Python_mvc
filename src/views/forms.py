from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField, SubmitField
from wtforms.validators import DataRequired, Email, Length, EqualTo
class LoginForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=6)])
    remember = BooleanField('Recordar sesión')
    submit = SubmitField('Iniciar Sesión')

class RegisterForm(FlaskForm): 
    nombre = StringField('Nombres', validators=[DataRequired()]) 
    apellidos = StringField('Apellidos', validators=[DataRequired()]) 
    cedula = StringField('Cédula', validators=[DataRequired()])
    labor = StringField('Labor', validators=[DataRequired()]) 
    correo = StringField('Correo', validators=[DataRequired(), Email()])
    celular = StringField('Celular',validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=6)])
    ciudad = ciudad ('Ciudad', validators=[DataRequired])
    confirm_password = PasswordField('Confirme Password', validators=[DataRequired(), EqualTo('password')]) 
    submit = SubmitField('Guardar')