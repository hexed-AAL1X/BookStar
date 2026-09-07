import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OrdersService } from '../../core/services/orders.service';
import { UserService } from '../../core/services/users.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { Order } from '../../models/order.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-orders',
  imports: [RouterModule, CommonModule],
  templateUrl: './orders.html',
  styleUrl: './orders.css'
})
export class Orders implements OnInit {
  orders: Order[] = [];
  loading = false;
  currentUser: User | null = null;
  isAuthor = false;
  isAdmin = false;
  stats = {
    total: 0,
    pending: 0,
    completed: 0
  };
  showNotifications = false;
  completedOrders: Order[] = [];
  allUsers: User[] = [];

  constructor(
    private ordersService: OrdersService,
    private userService: UserService,
    private snackbarService: SnackbarService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.subscribeToOrders();
    if (this.isAdmin) {
      this.loadAllUsers();
    }
  }

  subscribeToOrders(): void {
    this.ordersService.orders$.subscribe(orders => {
      if (orders.length > 0) {
        this.orders = orders;
        this.calculateStats();
      }
    });
  }

  loadCurrentUser(): void {
    this.userService.getProfile().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.isAuthor = user.role === 'author';
        this.isAdmin = user.email?.endsWith('@admin.com') || user.role === 'admin';
        this.loadOrders();
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
        // Cargar pedidos de todas formas
        this.loadOrders();
      }
    });
  }

  loadOrders(): void {
    this.loading = true;
    
    console.log('Loading orders/sales for user:', this.currentUser);
    console.log('Is author:', this.isAuthor);
    console.log('Is admin:', this.isAdmin);
    
    if (this.isAdmin) {
      // Para admins, obtener todas las órdenes
      this.ordersService.getAllOrders().subscribe({
        next: (orders: any) => {
          if (Array.isArray(orders)) {
            this.orders = orders;
          } else if (orders && orders.data && Array.isArray(orders.data)) {
            this.orders = orders.data;
          } else {
            this.orders = [];
          }
          this.calculateStats();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading all orders (admin):', error);
          this.orders = [];
          this.loading = false;
        }
      });
      return;
    }
    // Para usuarios normales, NO llamar a getAllOrders
    let observable;
    if (this.isAuthor) {
      observable = this.ordersService.getAuthorSales();
      console.log('Author: loading author sales');
    } else {
      observable = this.ordersService.getOrders();
      console.log('Buyer: loading user orders');
    }
    observable.subscribe({
      next: (response: any) => {
        let orders: Order[] = [];
        if (Array.isArray(response)) {
          orders = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          orders = response.data;
        } else {
          orders = [];
        }
        this.orders = orders;
        this.calculateStats();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading orders/sales:', error);
        this.loading = false;
      }
    });
  }

  // Método de fallback para cargar todas las órdenes y filtrar por autor
  private loadAllOrdersAndFilterForAuthor(): void {
    console.log('Loading all orders to filter for author sales');
    
    this.ordersService.getOrders().subscribe({
      next: (response: any) => {
        console.log('All orders response:', response);
        
        let allOrders: Order[] = [];
        if (Array.isArray(response)) {
          allOrders = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          allOrders = response.data;
        }
        
        // Filtrar órdenes que contengan libros del autor actual
        if (this.currentUser) {
          const authorId = this.currentUser.id || (this.currentUser as any)._id;
          console.log('Filtering orders for author ID:', authorId);
          
          const authorOrders = allOrders.filter(order => 
            order.items.some(item => item.bookId && this.isBookByAuthor(item.bookId, authorId))
          );
          
          console.log('Filtered author orders:', authorOrders);
          this.orders = authorOrders;
          this.calculateStats();
        }
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading all orders:', error);
        this.loading = false;
      }
    });
  }

  // Método para verificar si un libro pertenece al autor
  private isBookByAuthor(bookId: string, authorId: string): boolean {
    // Buscar el libro en la lista de libros cargados
    // Si no está disponible, asumir que pertenece al autor para mostrar datos
    // En una implementación completa, se cargaría el libro desde el backend
    return true; // Por ahora retornamos true para mostrar todas las órdenes
  }

  calculateStats(): void {
    this.stats.total = this.orders.length;
    this.stats.pending = this.orders.filter(order => order.paymentStatus === 'pending').length;
    this.stats.completed = this.orders.filter(order => order.paymentStatus === 'completed').length;
    
    // Filtrar pedidos completados recientemente (últimas 24 horas)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    this.completedOrders = this.orders.filter(order => 
      order.paymentStatus === 'completed' && 
      new Date(order.updatedAt || order.createdAt) > oneDayAgo
    );
    
    // Mostrar notificaciones si hay pedidos completados recientemente
    this.showNotifications = this.completedOrders.length > 0;
  }

  // Calcular ganancias totales del autor
  getTotalEarnings(): number {
    if (!this.isAuthor || this.isAdmin) return 0;
    return this.orders
      .filter(order => order.paymentStatus === 'completed')
      .reduce((total, order) => total + this.getAuthorEarnings(order), 0);
  }

  getOrderTotal(order: Order): number {
    return order.items.reduce((total, item) => total + item.totalPrice, 0);
  }

  // Para autores: calcular ganancias (asumiendo 70% del precio de venta)
  getAuthorEarnings(order: Order): number {
    if (!this.isAuthor || this.isAdmin) return 0;
    const total = this.getOrderTotal(order);
    return total * 0.7; // 70% para el autor
  }

  getOrderItemsText(order: Order): string {
    return order.items.map(item => item.title).join(', ');
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'completed': return 'delivered';
      case 'pending': return 'pending';
      case 'in_progress': return 'processing';
      case 'shipped': return 'shipped';
      case 'failed': return 'cancelled';
      default: return 'pending';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'completed': return 'Completado';
      case 'pending': return 'Pendiente';
      case 'in_progress': return 'En Proceso';
      case 'shipped': return 'Enviado';
      case 'failed': return 'Fallido';
      default: return 'Pendiente';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  viewOrder(orderId: string): void {
    console.log('View order:', orderId);
    // Implementar vista detallada del pedido
  }

  trackOrder(orderId: string): void {
    console.log('Track order:', orderId);
    // Implementar rastreo del pedido
  }

  cancelOrder(orderId: string): void {
    console.log('Cancel order:', orderId);
    // Implementar cancelación del pedido
  }

  reviewOrder(orderId: string): void {
    console.log('Review order:', orderId);
    // Implementar reseña del pedido
  }

  closeNotifications(): void {
    this.showNotifications = false;
  }

  getNotificationTime(order: Order): string {
    const orderDate = new Date(order.updatedAt || order.createdAt);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Hace menos de 1 hora';
    } else if (diffInHours === 1) {
      return 'Hace 1 hora';
    } else {
      return `Hace ${diffInHours} horas`;
    }
  }

  // Método para actualizar el estado del pedido (solo para autores y admins)
  updateOrderStatus(orderId: string, newStatus: string): void {
    if (!this.isAuthor && !this.isAdmin) {
      console.log('Solo los autores y administradores pueden actualizar el estado de los pedidos');
      return;
    }

    console.log('Actualizando estado del pedido:', orderId, 'a:', newStatus);
    
    this.ordersService.updateOrder(orderId, { status: newStatus }).subscribe({
      next: (response) => {
        console.log('Estado actualizado exitosamente:', response);
        // El servicio ya actualiza automáticamente la lista de órdenes
        this.calculateStats(); // Recalcular estadísticas
      },
      error: (error) => {
        console.error('Error actualizando estado del pedido:', error);
      }
    });
  }

  // Obtener opciones de estado disponibles
  getStatusOptions(): string[] {
    return ['pending', 'in_progress', 'shipped', 'completed', 'failed'];
  }

  // Obtener texto del estado para mostrar
  getStatusDisplayText(status: string): string {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'in_progress': return 'En Proceso';
      case 'shipped': return 'Enviado';
      case 'completed': return 'Completado';
      case 'failed': return 'Fallido';
      default: return 'Pendiente';
    }
  }

  // Método auxiliar para manejar el cambio de estado desde el template
  onStatusChange(orderId: string, event: Event): void {
    // Solo actualizar el valor local, no hacer la llamada al servidor
    const select = event.target as HTMLSelectElement;
    console.log('Status changed locally to:', select.value);
  }

  // Método para confirmar el cambio de estado
  confirmStatusChange(orderId: string, newStatus: string): void {
    const oldStatus = this.orders.find(o => o._id === orderId)?.paymentStatus;
    
    console.log('Confirming status change from', oldStatus, 'to', newStatus);
    console.log('Order ID:', orderId);
    console.log('Sending data to backend:', { paymentStatus: newStatus });
    console.log('Full request payload:', JSON.stringify({ paymentStatus: newStatus }, null, 2));
    
    this.ordersService.updateOrderStatus(orderId, newStatus as Order['paymentStatus']).subscribe({
      next: (updatedOrder) => {
        console.log('Order status updated successfully:', updatedOrder);
        
        // Actualizar la orden en la lista local
        const orderIndex = this.orders.findIndex(order => order._id === orderId);
        if (orderIndex !== -1) {
          this.orders[orderIndex] = updatedOrder;
          this.calculateStats();
        }
        
        // Si el nuevo estado es 'completed', reducir el stock de cada libro
        if (newStatus === 'completed' && updatedOrder.items) {
          updatedOrder.items.forEach(item => {
            this.ordersService.updateBookStock(item.bookId, item.quantity).subscribe({
              next: (stockResponse) => {
                console.log(`Stock actualizado para libro ${item.bookId}:`, stockResponse);
              },
              error: (stockError) => {
                console.error(`Error actualizando stock para libro ${item.bookId}:`, stockError);
              }
            });
          });
        }
        
        // Mostrar notificación de éxito
        this.snackbarService.showSuccess(
          'Estado actualizado',
          `Estado actualizado: ${this.getStatusDisplayText(oldStatus || '')} → ${this.getStatusDisplayText(newStatus)}`
        );
      },
              error: (error) => {
          console.error('Error updating order status:', error);
          console.error('Error details:', {
            status: error.status,
            statusText: error.statusText,
            url: error.url,
            error: error.error,
            message: error.message
          });
          
          // Intentar obtener más detalles del error
          if (error.error) {
            console.error('Backend error response:', error.error);
          }
          
          // Revertir el select al valor anterior
          const order = this.orders.find(o => o._id === orderId);
          if (order) {
            // Encontrar el select y actualizar su valor
            const select = document.querySelector(`select[data-order="${orderId}"]`) as HTMLSelectElement;
            if (select) {
              select.value = order.paymentStatus;
            }
          }
          
          // Mostrar notificación de error con más detalles
          const errorMessage = error.error?.message || error.message || 'Error desconocido';
          this.snackbarService.showError('Error al actualizar', `No se pudo actualizar el estado: ${errorMessage}`);
        }
    });
  }

  // Método para obtener el autor de una orden (para admins)
  getOrderAuthor(order: Order): string {
    // Por ahora retornamos información básica
    // En una implementación completa, se cargaría la información del autor
    if (order.items && order.items.length > 0) {
      return order.items[0].bookId || 'N/A';
    }
    return 'N/A';
  }

  // Métodos para compradores - editar cantidad
  editOrderQuantity(orderId: string, newQuantity: number): void {
    console.log('Updating order quantity:', orderId, 'to:', newQuantity);
    
    this.ordersService.updateOrderQuantity(orderId, newQuantity).subscribe({
      next: (updatedOrder) => {
        console.log('Order quantity updated successfully:', updatedOrder);
        
        // Actualizar la orden en la lista local
        const orderIndex = this.orders.findIndex(order => order._id === orderId);
        if (orderIndex !== -1) {
          this.orders[orderIndex] = updatedOrder;
          this.calculateStats();
        }
        
        // Mostrar notificación de éxito
        this.snackbarService.showSuccess('Cantidad actualizada', `La cantidad ha sido actualizada a ${newQuantity}`);
      },
      error: (error) => {
        console.error('Error updating order quantity:', error);
        // Mostrar notificación de error
        this.snackbarService.showError('Error al actualizar', 'No se pudo actualizar la cantidad del pedido');
      }
    });
  }

  // Métodos para compradores - eliminar orden
  deleteOrder(orderId: string): void {
    console.log('deleteOrder called with ID:', orderId);
    console.log('Current user role:', this.isAuthor ? 'author' : (this.isAdmin ? 'admin' : 'buyer'));
    
    if (confirm('¿Estás seguro de que quieres eliminar este pedido?')) {
      console.log('User confirmed deletion, calling service...');
      
      this.ordersService.deleteOrder(orderId).subscribe({
        next: (response) => {
          console.log('Order deleted successfully:', response);
          
          // Remover la orden de la lista local
          this.orders = this.orders.filter(order => order._id !== orderId);
          this.calculateStats();
          
          // Mostrar notificación de éxito
          this.snackbarService.showSuccess('Pedido eliminado', 'El pedido ha sido eliminado correctamente');
        },
        error: (error) => {
          console.error('Error deleting order:', error);
          console.error('Error details:', error);
          // Mostrar notificación de error
          this.snackbarService.showError('Error al eliminar', 'No se pudo eliminar el pedido');
        }
      });
    } else {
      console.log('User cancelled deletion');
    }
  }

  // Método para manejar cambios de cantidad en inputs
  onQuantityChange(orderId: string, itemIndex: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const newQuantity = parseInt(input.value);
    
    if (newQuantity > 0) {
      this.editOrderQuantity(orderId, newQuantity);
    } else {
      // Revertir al valor anterior si es inválido
      const order = this.orders.find(o => o._id === orderId);
      if (order && order.items[itemIndex]) {
        input.value = order.items[itemIndex].quantity.toString();
      }
    }
  }

  // Método para confirmar cambio de cantidad
  confirmQuantityChange(orderId: string, itemIndex: number, value: string): void {
    const newQuantity = parseInt(value);
    
    if (newQuantity > 0 && newQuantity <= 10) {
      this.editOrderQuantity(orderId, newQuantity);
    } else {
      // Revertir al valor anterior si es inválido
      const order = this.orders.find(o => o._id === orderId);
      if (order && order.items[itemIndex]) {
        // Encontrar el input y actualizar su valor
        const input = document.querySelector(`input[data-order="${orderId}"][data-item="${itemIndex}"]`) as HTMLInputElement;
        if (input) {
          input.value = order.items[itemIndex].quantity.toString();
        }
      }
    }
  }

  // Verificar si una orden puede ser editada por el comprador
  canEditOrder(order: Order): boolean {
    // Solo permitir editar órdenes pendientes
    return order.paymentStatus === 'pending';
  }

  // Verificar si una orden puede ser eliminada por el comprador
  canDeleteOrder(order: Order): boolean {
    // Solo permitir eliminar órdenes pendientes
    const canDelete = order.paymentStatus === 'pending';
    console.log(`Order ${order._id} can be deleted:`, canDelete, 'Status:', order.paymentStatus);
    return canDelete;
  }

  loadAllUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (response: any) => {
        if (Array.isArray(response)) {
          this.allUsers = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          this.allUsers = response.data;
        } else {
          this.allUsers = [];
        }
      },
      error: (error) => {
        console.error('Error loading users for admin order view:', error);
        this.allUsers = [];
      }
    });
  }

  getUserName(userId: string): string {
    const user = this.allUsers?.find(u => u._id === userId);
    return user ? user.name : userId;
  }

  getAuthorName(authorId: string): string {
    const user = this.allUsers?.find(u => u._id === authorId);
    return user ? user.name : authorId;
  }
}
