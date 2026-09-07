import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService, AuthError } from '../../../core/services/auth.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { UserRole } from '../../../models/user.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  selectedRole: UserRole = 'buyer';
  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService, 
    private router: Router,
    private snackbarService: SnackbarService
  ) {}

  onRegister() {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.register({ name: this.name, email: this.email, password: this.password, role: this.selectedRole }).subscribe({
      next: (response) => {
        // Guardar token y usuario en localStorage
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        this.isLoading = false;
        this.snackbarService.showSuccess('¡Registro exitoso!', 'Bienvenido a BookStar');
        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 1500);
      },
      error: (error: AuthError) => {
        this.isLoading = false;
        this.errorMessage = error.message;
        this.snackbarService.showError('Error de registro', error.message);
      }
    });
  }

  private validateForm(): boolean {
    if (!this.name || !this.email || !this.password || !this.confirmPassword) {
      this.errorMessage = 'Por favor completa todos los campos';
      this.snackbarService.showWarning('Campos requeridos', 'Por favor completa todos los campos');
      return false;
    }

    if (this.name.length < 2) {
      this.errorMessage = 'El nombre debe tener al menos 2 caracteres';
      this.snackbarService.showWarning('Nombre muy corto', 'El nombre debe tener al menos 2 caracteres');
      return false;
    }

    if (!this.isValidEmail(this.email)) {
      this.errorMessage = 'Por favor ingresa un email válido';
      this.snackbarService.showWarning('Email inválido', 'Por favor ingresa un email válido');
      return false;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      this.snackbarService.showWarning('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      this.snackbarService.showWarning('Contraseñas diferentes', 'Las contraseñas no coinciden');
      return false;
    }

    return true;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Los métodos showSuccessMessage y showErrorMessage ya no son necesarios
  // ya que usamos el SnackbarService directamente

  clearError(): void {
    this.errorMessage = '';
  }
} 