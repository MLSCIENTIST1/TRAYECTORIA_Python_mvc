import axios from 'axios';

export class ApiService {
  private apiUrl = 'http://127.0.0.1:5000/api';

  async createService(serviceData: any): Promise<any> {
    try {
      const response = await axios.post(`${this.apiUrl}/create-service`, serviceData);
      return response.data; // Devuelve los datos de la API
    } catch (error) {
      console.error('Error en la solicitud POST:', error);
      throw error; // Lanza el error para manejarlo en el componente
    }
  }
}