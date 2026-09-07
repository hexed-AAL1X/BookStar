import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../core/services/users.service';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  isEditing = false;
  editingUser: Partial<User> = {};
  loading = false;
  errorMessage = '';
  successMessage = '';

  // Variables para cambio de contraseña
  showPasswordSection = false;
  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  showNewPassword = false;
  showConfirmPassword = false;
  changingPassword = false;

  constructor(private userService: UserService, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.userService.getProfile().subscribe({
      next: (user) => {
        this.user = user;
      },
      error: (err) => {
        this.user = null;
      }
    });
  }

  copyToClipboard(text: string | undefined) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    alert('¡Copiado al portapapeles!');
  }

  isProfileObject(profile: any): profile is { bio?: string; website?: string } {
    return profile && typeof profile === 'object';
  }

  startEditing(): void {
    if (!this.user) return;
    
    this.editingUser = {
      name: this.user.name,
      email: this.user.email,
      profile: this.user.profile,
      social: this.user.social
    };
    this.isEditing = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  cancelEditing(): void {
    this.isEditing = false;
    this.editingUser = {};
    this.errorMessage = '';
    this.successMessage = '';
  }

  saveProfile(): void {
    if (!this.user) return;
    
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.userService.updateProfile(this.editingUser).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.isEditing = false;
        this.editingUser = {};
        this.loading = false;
        this.successMessage = 'Perfil actualizado exitosamente';
        
        // Limpiar mensaje de éxito después de 3 segundos
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = 'Error al actualizar el perfil. Inténtalo de nuevo.';
        console.error('Error updating profile:', err);
      }
    });
  }

  getProfileBio(): string {
    if (typeof this.editingUser.profile === 'string') {
      return this.editingUser.profile;
    }
    return (this.editingUser.profile as any)?.bio || '';
  }

  setProfileBio(value: string): void {
    if (!this.editingUser.profile || typeof this.editingUser.profile === 'string') {
      this.editingUser.profile = {};
    }
    (this.editingUser.profile as any).bio = value;
  }

  getProfileWebsite(): string {
    if (typeof this.editingUser.profile === 'string') {
      return '';
    }
    return (this.editingUser.profile as any)?.website || '';
  }

  setProfileWebsite(value: string): void {
    if (!this.editingUser.profile || typeof this.editingUser.profile === 'string') {
      this.editingUser.profile = {};
    }
    (this.editingUser.profile as any).website = value;
  }

  getSocialTwitter(): string {
    if (typeof this.editingUser.social === 'string') {
      return '';
    }
    return (this.editingUser.social as any)?.twitter || '';
  }

  setSocialTwitter(value: string): void {
    if (!this.editingUser.social || typeof this.editingUser.social === 'string') {
      this.editingUser.social = {};
    }
    (this.editingUser.social as any).twitter = value;
  }

  getSocialInstagram(): string {
    if (typeof this.editingUser.social === 'string') {
      return '';
    }
    return (this.editingUser.social as any)?.instagram || '';
  }

  setSocialInstagram(value: string): void {
    if (!this.editingUser.social || typeof this.editingUser.social === 'string') {
      this.editingUser.social = {};
    }
    (this.editingUser.social as any).instagram = value;
  }

  // Métodos para cambio de contraseña
  togglePasswordSection(): void {
    this.showPasswordSection = !this.showPasswordSection;
    if (!this.showPasswordSection) {
      this.resetPasswordForm();
    }
  }

  resetPasswordForm(): void {
    this.passwordData = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    this.showNewPassword = false;
    this.showConfirmPassword = false;
    this.errorMessage = '';
    this.successMessage = '';
  }

  togglePasswordVisibility(field: 'new' | 'confirm'): void {
    switch (field) {
      case 'new':
        this.showNewPassword = !this.showNewPassword;
        break;
      case 'confirm':
        this.showConfirmPassword = !this.showConfirmPassword;
        break;
    }
  }

  validatePassword(): { isValid: boolean; message: string } {
    const { newPassword, confirmPassword } = this.passwordData;

    if (!newPassword.trim()) {
      return { isValid: false, message: 'La nueva contraseña es requerida' };
    }

    if (newPassword.length < 6) {
      return { isValid: false, message: 'La nueva contraseña debe tener al menos 6 caracteres' };
    }

    if (newPassword !== confirmPassword) {
      return { isValid: false, message: 'Las contraseñas no coinciden' };
    }

    return { isValid: true, message: '' };
  }

  changePassword(): void {
    const validation = this.validatePassword();
    if (!validation.isValid) {
      this.errorMessage = validation.message;
      return;
    }

    this.changingPassword = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Usar el método updateProfile existente con la nueva contraseña
    const updateData = {
      password: this.passwordData.newPassword
    };

    console.log('Enviando datos de cambio de contraseña:', updateData);
    
    this.userService.updateProfile(updateData).subscribe({
      next: (updatedUser) => {
        console.log('Contraseña cambiada exitosamente:', updatedUser);
        this.user = updatedUser;
        this.changingPassword = false;
        this.successMessage = 'Contraseña cambiada exitosamente. Serás redirigido al login en 3 segundos...';
        this.resetPasswordForm();
        this.showPasswordSection = false;
        
        // Cerrar sesión y redirigir después de 3 segundos
        setTimeout(() => {
          this.authService.logout();
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (err: any) => {
        console.error('Error detallado al cambiar contraseña:', err);
        this.changingPassword = false;
        this.errorMessage = 'Error al cambiar la contraseña. Verifica tu contraseña actual.';
        console.error('Error changing password:', err);
      }
    });
  }
} 