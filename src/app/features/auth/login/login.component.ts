import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService, AuthError } from '../../../core/services/auth.service';
import { SnackbarService } from '../../../core/services/snackbar.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService, 
    private router: Router,
    private snackbarService: SnackbarService
  ) {}

  onLogin() {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (response) => {
        // Guardar token y usuario en localStorage
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        console.log('Token saved:', response.token);
        console.log('User saved:', response.user);
        
        this.isLoading = false;
        this.snackbarService.showSuccess('¡Bienvenido!', 'Has iniciado sesión correctamente');
        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 1500);
      },
      error: (error: AuthError) => {
        this.isLoading = false;
        this.errorMessage = error.message;
        this.snackbarService.showError('Error de inicio de sesión', error.message);
      }
    });
  }

  private validateForm(): boolean {
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor completa todos los campos';
      this.snackbarService.showWarning('Campos requeridos', 'Por favor completa todos los campos');
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