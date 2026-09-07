import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SnackbarType } from '../../shared/snackbar/snackbar.component';

export interface SnackbarData {
  type: SnackbarType;
  title: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SnackbarService {
  private snackbarSubject = new BehaviorSubject<SnackbarData | null>(null);
  public snackbar$ = this.snackbarSubject.asObservable();

  constructor() { }

  // Mostrar mensaje de éxito
  showSuccess(title: string, message: string, duration: number = 4000): void {
    this.show({
      type: 'success',
      title,
      message,
      duration
    });
  }

  // Mostrar mensaje de error
  showError(title: string, message: string, duration: number = 6000): void {
    this.show({
      type: 'error',
      title,
      message,
      duration
    });
  }

  // Mostrar mensaje de advertencia
  showWarning(title: string, message: string, duration: number = 5000): void {
    this.show({
      type: 'warning',
      title,
      message,
      duration
    });
  }

  // Método genérico para mostrar snackbar
  private show(data: SnackbarData): void {
    this.snackbarSubject.next(data);
  }

  // Ocultar snackbar manualmente
  hide(): void {
    this.snackbarSubject.next(null);
  }

  // Métodos de conveniencia para casos comunes
  showSuccessMessage(message: string): void {
    this.showSuccess('¡Éxito!', message);
  }

  showErrorMessage(message: string): void {
    this.showError('Error', message);
  }

  showWarningMessage(message: string): void {
    this.showWarning('Advertencia', message);
  }

  // Métodos específicos para operaciones CRUD
  showCreateSuccess(resource: string): void {
    this.showSuccess('Creado exitosamente', `${resource} ha sido creado correctamente.`);
  }

  showUpdateSuccess(resource: string): void {
    this.showSuccess('Actualizado exitosamente', `${resource} ha sido actualizado correctamente.`);
  }

  showDeleteSuccess(resource: string): void {
    this.showSuccess('Eliminado exitosamente', `${resource} ha sido eliminado correctamente.`);
  }

  showCreateError(resource: string, error?: string): void {
    this.showError('Error al crear', `No se pudo crear ${resource}. ${error || ''}`);
  }

  showUpdateError(resource: string, error?: string): void {
    this.showError('Error al actualizar', `No se pudo actualizar ${resource}. ${error || ''}`);
  }

  showDeleteError(resource: string, error?: string): void {
    this.showError('Error al eliminar', `No se pudo eliminar ${resource}. ${error || ''}`);
  }

  showLoadError(resource: string, error?: string): void {
    this.showError('Error al cargar', `No se pudieron cargar ${resource}. ${error || ''}`);
  }

  showNetworkError(): void {
    this.showError('Error de conexión', 'No se pudo conectar con el servidor. Verifica tu conexión a internet.');
  }

  showAuthError(): void {
    this.showError('Error de autenticación', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
  }

  showValidationError(field?: string): void {
    const message = field ? `Error de validación en ${field}` : 'Error de validación';
    this.showWarning('Datos inválidos', message);
  }

  showPermissionError(): void {
    this.showWarning('Acceso denegado', 'No tienes permisos para realizar esta acción.');
  }
} 