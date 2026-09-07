import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../env/enviroment';
import { Order } from '../../models/order.model';

export interface OrderResponse {
  success: boolean;
  data: Order[];
  message?: string;
}

export interface OrderDetailResponse {
  success: boolean;
  data: Order;
  message?: string;
}

export interface OrderWithUser extends Order {
  user?: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface CreateOrderRequest {
  items: Array<{
    bookId: string;
    title?: string;
    quantity: number;
    unitPrice?: number;
    totalPrice?: number;
  }>;
  shippingAddress: {
    street?: string;
    city?: string;
    country?: string;
    zipCode?: string;
  };
  paymentMethod?: string;
}

export interface UpdateOrderRequest {
  status?: string;
  trackingNumber?: string;
  notes?: string;
}

export interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private apiUrl = environment.apiUrl;
  private ordersSubject = new BehaviorSubject<Order[]>([]);
  public orders$ = this.ordersSubject.asObservable();

  constructor(private http: HttpClient) { }

  // Obtener todas las órdenes del usuario
  getOrders(): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(`${this.apiUrl}/orders`)
      .pipe(
        tap(response => {
          if (response.success) {
            this.ordersSubject.next(response.data);
          }
        }),
        catchError(this.handleError)
      );
  }

  // Obtener todos los pedidos (solo admins)
  getAllOrders(): Observable<OrderWithUser[]> {
    return this.http.get<OrderWithUser[]>(`${this.apiUrl}/orders/all`);
  }

  // Obtener ventas del autor (órdenes que contienen libros del autor)
  getAuthorSales(): Observable<OrderResponse> {
    console.log('Calling getAuthorSales endpoint:', `${this.apiUrl}/orders/author-sales`);
    
    return this.http.get<OrderResponse>(`${this.apiUrl}/orders/author-sales`)
      .pipe(
        tap(response => {
          console.log('getAuthorSales response:', response);
          if (response.success) {
            console.log('Author sales loaded successfully, count:', response.data.length);
            this.ordersSubject.next(response.data);
          } else {
            console.log('getAuthorSales failed:', response.message);
          }
        }),
        catchError(error => {
          console.log('getAuthorSales endpoint failed, trying fallback method:', error);
          // Si el endpoint específico falla, usar el método de fallback
          return this.getAuthorSalesFallback();
        })
      );
  }

  // Método de fallback para obtener ventas del autor
  private getAuthorSalesFallback(): Observable<OrderResponse> {
    console.log('Using fallback method to get author sales');
    
    return this.http.get<OrderResponse>(`${this.apiUrl}/orders`)
      .pipe(
        tap(response => {
          if (response.success) {
            // Filtrar órdenes que contengan libros del autor actual
            // Esto requiere que tengamos acceso al usuario actual
            console.log('All orders loaded, will filter for author sales');
            this.ordersSubject.next(response.data);
          }
        }),
        catchError(this.handleError)
      );
  }

  // Obtener orden por ID
  getOrderById(id: string): Observable<OrderDetailResponse> {
    return this.http.get<OrderDetailResponse>(`${this.apiUrl}/orders/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Crear nueva orden
  createOrder(orderData: CreateOrderRequest): Observable<OrderDetailResponse> {
    return this.http.post<OrderDetailResponse>(`${this.apiUrl}/orders`, orderData)
      .pipe(
        tap(response => {
          if (response.success) {
            // Actualizar la lista de órdenes
            const currentOrders = this.ordersSubject.value;
            this.ordersSubject.next([response.data, ...currentOrders]);
          }
        }),
        catchError(this.handleError)
      );
  }

  // Actualizar stock de libros después de una compra
  updateBookStock(bookId: string, quantity: number): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${this.apiUrl}/books/${bookId}/stock`, {
      quantity: quantity
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Actualizar orden
  updateOrder(id: string, orderData: UpdateOrderRequest): Observable<OrderDetailResponse> {
    return this.http.put<OrderDetailResponse>(`${this.apiUrl}/orders/${id}`, orderData)
      .pipe(
        tap(response => {
          if (response.success) {
            // Actualizar la lista de órdenes
            const currentOrders = this.ordersSubject.value;
            const updatedOrders = currentOrders.map(order => 
              order._id === id ? response.data : order
            );
            this.ordersSubject.next(updatedOrders);
          }
        }),
        catchError(this.handleError)
      );
  }
  // Actualizar solo el estado del pedido (para authors)
  updateOrderStatus(id: string, status: Order['paymentStatus']): Observable<Order> {
    const payload = { paymentStatus: status };
    
    console.log('OrdersService - updateOrderStatus called with:');
    console.log('URL:', `${this.apiUrl}/orders/${id}`);
    console.log('Payload:', payload);
    console.log('Full request:', {
      method: 'PUT',
      url: `${this.apiUrl}/orders/${id}`,
      body: payload
    });
    
    return this.http.put<Order>(`${this.apiUrl}/orders/${id}`, payload);
  }

  // Actualizar solo la cantidad del pedido (para usuarios)
  updateOrderQuantity(id: string, quantity: number): Observable<Order> {
    return this.http.put<Order>(`${this.apiUrl}/orders/${id}`, { quantity: quantity });
  }


  // Cancelar orden
  cancelOrder(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${this.apiUrl}/orders/${id}/cancel`, {})
      .pipe(
        tap(response => {
          if (response.success) {
            // Actualizar el estado de la orden
            const currentOrders = this.ordersSubject.value;
            const updatedOrders = currentOrders.map(order => 
              order._id === id ? { ...order, status: 'cancelled' } : order
            );
            this.ordersSubject.next(updatedOrders);
          }
        }),
        catchError(this.handleError)
      );
  }

  // Eliminar orden completamente (para compradores)
  deleteOrder(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/orders/${id}`)
      .pipe(
        tap(response => {
          if (response.success) {
            // Remover la orden de la lista
            const currentOrders = this.ordersSubject.value;
            const filteredOrders = currentOrders.filter(order => order._id !== id);
            this.ordersSubject.next(filteredOrders);
          }
        }),
        catchError(this.handleError)
      );
  }

  // Obtener estadísticas de órdenes
  getOrderStats(): Observable<{ success: boolean; data: OrderStats }> {
    return this.http.get<{ success: boolean; data: OrderStats }>(`${this.apiUrl}/orders/stats`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Obtener órdenes por estado
  getOrdersByStatus(status: string): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(`${this.apiUrl}/orders/status/${status}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Obtener historial de órdenes
  getOrderHistory(): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(`${this.apiUrl}/orders/history`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Rastrear orden
  trackOrder(id: string): Observable<{ success: boolean; data: any }> {
    return this.http.get<{ success: boolean; data: any }>(`${this.apiUrl}/orders/${id}/track`)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error inesperado';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 400:
          errorMessage = 'Datos de entrada inválidos';
          break;
        case 401:
          errorMessage = 'No autorizado';
          break;
        case 404:
          errorMessage = 'Orden no encontrada';
          break;
        case 409:
          errorMessage = 'No se puede cancelar esta orden';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          break;
        default:
          errorMessage = `Error ${error.status}: ${error.message}`;
      }
    }
    
    return throwError(() => ({ message: errorMessage, status: error.status }));
  }
}
