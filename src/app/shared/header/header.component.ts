import { Component, OnInit, HostListener } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { OrdersService } from '../../core/services/orders.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {
  menuOpen = false;

  constructor(public auth: AuthService, private router: Router, private ordersService: OrdersService) {}

  isLoggedIn(): boolean {
    return this.auth.isAuthenticated();
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToProfile() {
    this.router.navigate(['/users/profile']);
  }

  ngOnInit(): void {
    if (this.isLoggedIn()) {
      // Eliminar variables y métodos relacionados con notificaciones
      // - notificationsOpen
      // - notifications
      // - notificationCount
      // - subscribeToOrders
      // - loadNotifications
      // - toggleNotifications
      // - closeNotifications
      // - getNotificationTime
      // - getOrderTotal (si solo se usa para notificaciones)
      // - onDocumentClick (si solo se usa para cerrar notificaciones)
    }
  }

  getUserInfo(): any {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getUserRole(): string {
    const user = this.getUserInfo();
    if (!user) return '';
    
    // Si el email termina en @admin.com, es admin sin importar el role
    if (user.email && user.email.endsWith('@admin.com')) {
      return 'Administrador';
    }
    
    switch (user.role) {
      case 'buyer':
        return 'Comprador';
      case 'author':
        return 'Autor';
      case 'admin':
        return 'Administrador';
      default:
        return user.role;
    }
  }

  isAuthor(): boolean {
    const user = this.getUserInfo();
    return user?.role === 'author';
  }

  isAdmin(): boolean {
    const user = this.getUserInfo();
    return user?.email?.endsWith('@admin.com') || user?.role === 'admin';
  }

  getOrdersText(): string {
    if (this.isAdmin()) return 'Todas las Órdenes';
    return this.isAuthor() ? 'Ventas' : 'Pedidos';
  }
} 