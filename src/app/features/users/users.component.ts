import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../../core/services/users.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { User } from '../../models/user.model';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  loading = false;
  currentUser: User | null = null;
  isAdmin = false;
  stats = {
    total: 0,
    buyers: 0,
    authors: 0,
    admins: 0
  };

  constructor(
    private userService: UserService,
    private snackbarService: SnackbarService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  loadCurrentUser(): void {
    this.userService.getProfile().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.isAdmin = user.email?.endsWith('@admin.com') || user.role === 'admin';
        
        if (this.isAdmin) {
          this.loadAllUsers();
        } else {
          this.snackbarService.showError('Acceso denegado', 'Solo los administradores pueden acceder a esta página');
        }
      },
      error: (error: any) => {
        console.error('Error loading user profile:', error);
        // Si es error 403 o 401, el interceptor ya maneja la redirección
        if (error.status !== 401 && error.status !== 403) {
          this.snackbarService.showError('Error', 'No se pudo cargar el perfil del usuario');
        }
      }
    });
  }

  loadAllUsers(): void {
    this.loading = true;
    
    this.userService.getAllUsers().subscribe({
      next: (response: any) => {
        console.log('Users response:', response);
        
        let users: User[] = [];
        if (Array.isArray(response)) {
          users = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          users = response.data;
        }
        
        this.users = users;
        this.calculateStats();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading users:', error);
        this.snackbarService.showError('Error', 'No se pudieron cargar los usuarios');
        this.loading = false;
      }
    });
  }

  calculateStats(): void {
    this.stats.total = this.users.length;
    this.stats.buyers = this.users.filter(user => user.role === 'buyer').length;
    this.stats.authors = this.users.filter(user => user.role === 'author').length;
    this.stats.admins = this.users.filter(user => 
      user.role === 'admin' || user.email?.endsWith('@admin.com')
    ).length;
  }

  getUserRoleText(role: string): string {
    switch (role) {
      case 'buyer': return 'Comprador';
      case 'author': return 'Autor';
      case 'admin': return 'Administrador';
      default: return role;
    }
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'buyer': return 'buyer-badge';
      case 'author': return 'author-badge';
      case 'admin': return 'admin-badge';
      default: return 'default-badge';
    }
  }

  formatDate(dateString: string | Date): string {
    if (!dateString) return 'N/A';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  // Métodos para administradores
  deleteUser(userId: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.')) {
      this.userService.deleteUser(userId).subscribe({
        next: (response) => {
          console.log('User deleted successfully:', response);
          this.users = this.users.filter(user => user._id !== userId);
          this.calculateStats();
          this.snackbarService.showSuccess('Usuario eliminado', 'El usuario ha sido eliminado correctamente');
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          this.snackbarService.showError('Error', 'No se pudo eliminar el usuario');
        }
      });
    }
  }

  onRoleChange(event: Event, userId: string): void {
    const target = event.target as HTMLSelectElement;
    const newRole = target.value;
    this.updateUserRole(userId, newRole);
  }

  updateUserRole(userId: string, newRole: string): void {
    this.userService.updateUserRole(userId, newRole).subscribe({
      next: (response: any) => {
        console.log('User role updated successfully:', response);
        
        // Actualizar el usuario en la lista local
        const userIndex = this.users.findIndex(user => user._id === userId);
        if (userIndex !== -1) {
          this.users[userIndex] = response.data;
          this.calculateStats();
        }
        
        this.snackbarService.showSuccess('Rol actualizado', `El rol del usuario ha sido actualizado a ${this.getUserRoleText(newRole)}`);
      },
      error: (error: any) => {
        console.error('Error updating user role:', error);
        this.snackbarService.showError('Error', 'No se pudo actualizar el rol del usuario');
      }
    });
  }

  exportUsers(): void {
    const doc = new jsPDF();
    doc.text('Lista de Usuarios', 14, 16);
    const columns = ['Nombre', 'Email', 'Rol'];
    const rows = this.users.map(user => [user.name, user.email, this.getUserRoleText(user.role)]);
    autoTable(doc, { head: [columns], body: rows, startY: 22 });
    doc.save('usuarios.pdf');
    this.snackbarService.showSuccess('Exportación', 'Los datos de usuarios han sido exportados en PDF');
  }
} 