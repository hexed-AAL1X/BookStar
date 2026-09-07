import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PostService } from '../../core/services/posts.service';
import { BookService } from '../../core/services/books.service';
import { OrdersService } from '../../core/services/orders.service';
import { UserService } from '../../core/services/users.service';
import { Post } from '../../models/post.model';
import { Order } from '../../models/order.model';

@Component({
  selector: 'app-home',
  imports: [RouterModule, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  recentPosts: Post[] = [];
  loading = false;
  stats = {
    books: 0,
    posts: 0,
    orders: 0
  };
  currentUser: any = null;

  constructor(
    private postService: PostService,
    private bookService: BookService,
    private ordersService: OrdersService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadRecentPosts();
    this.subscribeToPosts();
  }

  subscribeToPosts(): void {
    this.postService.posts$.subscribe(posts => {
      // Ordenar por fecha de creación (más recientes primero) y tomar los primeros 3
      this.recentPosts = posts
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3);
    });
  }

  loadCurrentUser(): void {
    const token = localStorage.getItem('token');
    console.log('Current token:', token);
    
    this.userService.getProfile().subscribe({
      next: (user) => {
        console.log('Profile loaded successfully:', user);
        this.currentUser = user;
        this.loadStats();
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
      }
    });
  }

  loadRecentPosts(): void {
    this.loading = true;
    this.postService.getAll().subscribe({
      next: (posts: Post[]) => {
        // Ordenar por fecha de creación (más recientes primero) y tomar los primeros 3
        this.recentPosts = posts
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 3);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading recent posts:', error);
        this.loading = false;
      }
    });
  }

  loadStats(): void {
    if (this.currentUser?.role === 'admin' || this.currentUser?.email?.endsWith('@admin.com')) {
      // Admin: mostrar totales globales
      this.bookService.getAll().subscribe({
        next: (books) => {
          this.stats.books = books.length;
        },
        error: () => {
          this.stats.books = 0;
        }
      });
      this.postService.getAll().subscribe({
        next: (posts) => {
          this.stats.posts = posts.length;
        },
        error: () => {
          this.stats.posts = 0;
        }
      });
      this.ordersService.getAllOrders().subscribe({
        next: (orders: any) => {
          if (Array.isArray(orders)) {
            this.stats.orders = orders.length;
          } else if (orders && orders.data && Array.isArray(orders.data)) {
            this.stats.orders = orders.data.length;
          } else {
            this.stats.orders = 0;
          }
        },
        error: () => {
          this.stats.orders = 0;
        }
      });
    } else {
      // No admin: mostrar solo los suyos
      this.ordersService.getOrders().subscribe({
        next: (response: any) => {
          let orders: any[] = [];
          if (Array.isArray(response)) {
            orders = response;
          } else if (response && response.data && Array.isArray(response.data)) {
            orders = response.data;
          }
          // Libros únicos comprados
          const uniqueBooks = new Set<string>();
          orders.forEach(order => {
            if (order.items && Array.isArray(order.items)) {
              order.items.forEach((item: any) => {
                if (item && item.bookId) {
                  uniqueBooks.add(item.bookId);
                }
              });
            }
          });
          this.stats.books = uniqueBooks.size;
          this.stats.orders = orders.length;
        },
        error: () => {
          this.stats.books = 0;
          this.stats.orders = 0;
        }
      });
      this.postService.getAll().subscribe({
        next: (posts) => {
          const userId = this.currentUser?.id || this.currentUser?._id;
          this.stats.posts = posts.filter(post => post.authorId === userId).length;
        },
        error: () => {
          this.stats.posts = 0;
        }
      });
    }
  }

  getTimeAgo(dateString: string): string {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Hace menos de 1 hora';
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Ayer';
    if (diffInDays < 7) return `Hace ${diffInDays} días`;
    
    return postDate.toLocaleDateString('es-ES');
  }

  getPostIcon(tags: string[]): string {
    if (tags.includes('reseña')) return '📖';
    if (tags.includes('noticia')) return '📰';
    if (tags.includes('recomendación')) return '⭐';
    if (tags.includes('análisis')) return '🔍';
    if (tags.includes('spoiler')) return '⚠️';
    return '📝';
  }
}
