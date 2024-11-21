from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'fa0f833a4332'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Crear tabla 'servicio'
    op.create_table('servicio',
        sa.Column('id_servicio', sa.Integer(), nullable=False),
        sa.Column('nombre_servicio', sa.String(), nullable=False),
        sa.Column('fecha_solicitud', sa.Date(), nullable=False),
        sa.Column('fecha_aceptaciòn', sa.Date(), nullable=False),
        sa.Column('fecha_inicio', sa.Date(), nullable=False),
        sa.Column('fecha_fin', sa.Date(), nullable=False),
        sa.Column('nombre_contratante', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id_servicio')
    )

    # Crear tabla 'usuario'
    op.create_table('usuario',
        sa.Column('id_usuario', sa.Integer(), nullable=False),
        sa.Column('nombre', sa.String(), nullable=False),
        sa.Column('apellidos', sa.String(), nullable=False),
        sa.Column('correo', sa.String(), nullable=False),
        sa.Column('contrasenia', sa.String(), nullable=False),
        sa.Column('labor', sa.String(), nullable=False),
        sa.Column('cedula', sa.BigInteger(), nullable=False),
        sa.Column('celular', sa.BigInteger(), nullable=False),
        sa.Column('ciudad', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id_usuario')
    )

    # Crear tabla 'calificacion'
    op.create_table('calificacion',
        sa.Column('id_calificacion', sa.Integer(), nullable=False),
        sa.Column('puntaje_por_labor', sa.Integer(), nullable=False),
        sa.Column('puntaje_global', sa.Integer(), nullable=False),
        sa.Column('comentario', sa.String(), nullable=True),
        sa.Column('id_servicio', sa.Integer(), nullable=True),
        sa.Column('id_usuario', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['id_servicio'], ['servicio.id_servicio'], ),
        sa.ForeignKeyConstraint(['id_usuario'], ['usuario.id_usuario'], ),
        sa.PrimaryKeyConstraint('id_calificacion')
    )

    # Crear tabla 'notification'
    op.create_table('notification',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('message', sa.String(length=256), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['usuario.id_usuario'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Crear tabla 'usuario_servicio'
    op.create_table('usuario_servicio',
        sa.Column('usuario_id', sa.Integer(), nullable=False),
        sa.Column('servicio_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['servicio_id'], ['servicio.id_servicio'], ),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuario.id_usuario'], ),
        sa.PrimaryKeyConstraint('usuario_id', 'servicio_id')
    )

def downgrade():
    op.drop_table('usuario_servicio')
    op.drop_table('notification')
    op.drop_table('calificacion')
    op.drop_table('usuario')
    op.drop_table('servicio')