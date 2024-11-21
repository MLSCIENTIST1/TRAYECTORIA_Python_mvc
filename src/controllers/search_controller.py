from flask import Blueprint, render_template, request, url_for
from flask_login import login_required
from src.models.usuarios import Usuario
from sqlalchemy import or_

search_bp = Blueprint('search', __name__)

@search_bp.route('/search/resultado_filtro_primera_busqueda', methods=['GET', 'POST'])
@login_required
def resultado_filtro_primera_busqueda():
    ciudad = request.args.get('ciudad')
    labor = request.args.get('labor')
    query = Usuario.query
    condiciones = []
    if ciudad:
        condiciones.append(Usuario.ciudad == ciudad)
    if labor:
        condiciones.append(Usuario.labor.ilike(f"%{labor}%"))
    if condiciones:
        query = query.filter(or_(*condiciones))
    resultados = query.all()
    
    return render_template('resultado_filtro_primera_busqueda.html', resultados=resultados)

@search_bp.route('/detalle_candidato/<int:id_usuario>', methods=['GET','POST'])
@login_required
def detalle_candidato(id_usuario):
    usuario = Usuario.query.get_or_404(id_usuario)
    print(url_for('search.detalle_candidato', id_usuario=id_usuario))
    return render_template('detalle_candidato.html', usuario=usuario)

print(search_bp.name)