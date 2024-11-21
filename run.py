from src import create_app

print("Inicializando la aplicación desde run.py")

try:
    app = create_app()  # Crear la aplicación
    print("Aplicación creada exitosamente")
except Exception as e:
    print(f"Error crítico al inicializar la aplicación: {e}")
    app = None

if app:
    @app.route('/')
    def home():
        return "¡Hola, Flask está funcionando!"

    if __name__ == "__main__":
        print("Ejecutando la aplicación en modo depuración")
        app.run(debug=True)