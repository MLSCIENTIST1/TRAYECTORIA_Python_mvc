from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '152a01115a6a'
down_revision = 'fa0f833a4332'
branch_labels = None
depends_on = None

def upgrade():
    # Agregar restricción de unicidad en la columna 'correo' de 'usuario'
    with op.batch_alter_table('usuario', schema=None) as batch_op:
        batch_op.create_unique_constraint(None, ['correo'])

def downgrade():
    with op.batch_alter_table('usuario', schema=None) as batch_op:
        batch_op.drop_constraint(None, type_='unique')