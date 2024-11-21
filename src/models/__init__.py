from src.models.database import db, init_app, create_database, DATABASE_URL

# Crear la base de datos al cargar el módulo
create_database()

# Exportar funciones clave para otros módulos
__all__ = ["db", "init_app", "DATABASE_URL"]