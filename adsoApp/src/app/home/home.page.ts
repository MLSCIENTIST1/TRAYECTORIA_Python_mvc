import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms'; // Importa FormsModule
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [IonicModule, FormsModule], // Agrega FormsModule aquí
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  serviceData: any = {
    nombre_servicio: '',
    fecha_solicitud: '',
    nombre_contratante: '',
    id_contratante: null,
  };

  private apiService = new ApiService();

  constructor() {}

  async sendService() {
    try {
      const response = await this.apiService.createService(this.serviceData);
      console.log('Servicio creado:', response);
      alert('¡Servicio creado exitosamente!');
      this.resetForm();
    } catch (error) {
      console.error('Error al enviar el servicio:', error);
      alert('Hubo un problema al enviar el servicio.');
    }
  }

  resetForm() {
    this.serviceData = {
      nombre_servicio: '',
      fecha_solicitud: '',
      nombre_contratante: '',
      id_contratante: null,
    };
  }
}