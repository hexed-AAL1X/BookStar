import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookService } from '../../core/services/books.service';
import { UserService } from '../../core/services/users.service';
import { OrdersService } from '../../core/services/orders.service';
import { Book, BookCategory } from '../../models/book.model';
import { User } from '../../models/user.model';
import { Subscription } from 'rxjs';
import { SnackbarService } from '../../core/services/snackbar.service';

@Component({
  selector: 'app-books',
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './books.html',
  styleUrl: './books.css'
})
export class Books implements OnInit, OnDestroy {
  books: Book[] = [];
  filteredBooks: Book[] = [];
  loading = false;
  searchQuery = '';
  selectedCategory = '';
  selectedPriceRange = '';
  selectedSort = 'title';
  categories: BookCategory[] = [
    'Ficción',
    'No Ficción',
    'Ciencia',
    'Tecnología',
    'Infantil',
    'Historia',
    'Fantasía',
    'Romance',
    'Misterio'
  ];
  authorsMap: { [key: string]: string } = {};
  
  // Paginación
  currentPage = 1;
  Math = Math; // Para usar en el template
  itemsPerPage = 4;
  totalPages = 1;
  paginatedBooks: Book[] = [];
  
  // Modal de pedido
  showOrderModal = false;
  selectedBook: Book | null = null;
  orderQuantity = 1;
  shippingAddress = {
    street: '',
    city: '',
    country: '',
    zipCode: ''
  };
  
  // Modal de detalles
  showDetailsModal = false;
  
  // Modal de publicar obra
  showPublishModal = false;
  currentUser: any = null;
  newBook = {
    title: '',
    description: '',
    price: 0,
    category: [] as BookCategory[],
    language: 'Español',
    stock: 1
  };
  
  private subscription = new Subscription();

  constructor(
    private bookService: BookService, 
    private userService: UserService,
    private ordersService: OrdersService,
    private snackbar: SnackbarService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadBooks();
    this.subscribeToBooks();
  }

  loadCurrentUser(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
      console.log('Usuario actual cargado:', this.currentUser);
    }
  }

  getCurrentAuthorName(): string {
    return this.currentUser?.name || 'Autor';
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  // Método para limpiar suscripciones específicas
  private clearSubscriptions(): void {
    this.subscription.unsubscribe();
    this.subscription = new Subscription();
  }

  loadBooks(): void {
    this.loading = true;
    this.subscription.add(
      this.bookService.getAll().subscribe({
        next: (books: Book[]) => {
          this.books = books;
          this.filteredBooks = books;
          this.loading = false;
          this.loadAuthors(books);
        },
        error: (error) => {
          console.error('Error loading books:', error);
          this.loading = false;
        }
      })
    );
  }

  // Suscribirse a cambios en tiempo real
  subscribeToBooks(): void {
    this.subscription.add(
      this.bookService.books$.subscribe(books => {
        if (books.length > 0) {
          this.books = books;
          this.applyFilters(); // Reaplicar filtros con los nuevos datos
          this.loadAuthors(books);
        }
      })
    );
  }

  loadAuthors(books: Book[]): void {
    // Obtener IDs únicos de autores
    const authorIds = [...new Set(books.map(book => book.authorId))];
    
    console.log('Libros cargados:', books);
    console.log('IDs de autores únicos:', authorIds);
    console.log('Mapa de autores actual:', this.authorsMap);
    
    // Cargar cada autor
    authorIds.forEach(authorId => {
      if (authorId && !this.authorsMap[authorId]) {
        console.log('Cargando autor con ID:', authorId);
        this.subscription.add(
          this.userService.getUserById(authorId).subscribe({
            next: (author: User) => {
              console.log('Autor cargado exitosamente:', author);
              this.authorsMap[authorId] = author.name || 'Autor desconocido';
              console.log('Mapa de autores actualizado:', this.authorsMap);
              // Actualizar los libros con el nombre del autor
              this.updateBooksWithAuthorNames();
            },
            error: (error) => {
              console.error(`Error loading author ${authorId}:`, error);
              this.authorsMap[authorId] = 'Autor desconocido';
              this.updateBooksWithAuthorNames();
            }
          })
        );
      } else {
        console.log('Autor ya cargado o ID inválido:', authorId);
      }
    });
  }

  updateBooksWithAuthorNames(): void {
    console.log('Actualizando nombres de autores en libros...');
    console.log('Mapa de autores disponible:', this.authorsMap);
    
    this.books.forEach(book => {
      console.log('Procesando libro:', book.title, 'con authorId:', book.authorId);
      if (book.authorId && this.authorsMap[book.authorId]) {
        book.authorName = this.authorsMap[book.authorId];
        console.log('Nombre de autor asignado:', book.authorName);
      } else {
        console.log('No se pudo asignar nombre de autor para:', book.title);
      }
    });
    
    console.log('Libros actualizados:', this.books);
    this.applyFilters();
    this.updatePagination();
  }

  // Modal de detalles
  openDetailsModal(book: Book): void {
    this.selectedBook = book;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedBook = null;
  }

  // Modal de publicar obra
  openPublishModal(): void {
    if (!this.currentUser) {
      this.snackbar.showErrorMessage('Error: No se pudo identificar al usuario');
      return;
    }

    if (this.currentUser.role !== 'author') {
      this.snackbar.showErrorMessage('Solo los autores pueden publicar obras');
      return;
    }

    this.showPublishModal = true;
  }

  closePublishModal(): void {
    this.showPublishModal = false;
    this.selectedBook = null;
    this.newBook = {
      title: '',
      description: '',
      price: 0,
      category: [] as BookCategory[],
      language: 'Español',
      stock: 1
    };
  }

  canPublishBook(): boolean {
    return this.currentUser?.role === 'author' &&
           this.newBook.title.trim() !== '' &&
           this.newBook.description.trim() !== '' &&
           this.newBook.price > 0 &&
           this.newBook.category.length > 0;
  }

  publishBook(): void {
    if (!this.canPublishBook()) {
      return;
    }

    if (!this.currentUser) {
      this.snackbar.showErrorMessage('Error: No se pudo identificar al usuario');
      return;
    }

    const bookData = {
      ...this.newBook,
      price: +this.newBook.price,
      stock: +this.newBook.stock,
      authorId: this.currentUser.id || this.currentUser._id
    };

    console.log('Book data:', bookData);

    // Si hay un libro seleccionado, es una edición
    if (this.selectedBook && this.selectedBook._id) {
      console.log('Updating existing book:', this.selectedBook._id);
      
      this.subscription.add(
        this.bookService.update(this.selectedBook._id, bookData).subscribe({
          next: (response: Book) => {
            console.log('Book updated:', response);
            this.snackbar.showSuccessMessage('Libro actualizado con éxito');
            this.closePublishModal();
            this.updateBooksList();
          },
          error: (error: any) => {
            console.error('Error updating book:', error);
            this.snackbar.showErrorMessage('Error al actualizar el libro');
          }
        })
      );
    } else {
      // Es un libro nuevo
      console.log('Creating new book');
      
      this.subscription.add(
        this.bookService.create(bookData).subscribe({
          next: (response: Book) => {
            console.log('Book published:', response);
            this.snackbar.showSuccessMessage('Libro publicado con éxito');
            this.closePublishModal();
            this.updateBooksList();
          },
          error: (error: any) => {
            console.error('Error publishing book:', error);
            this.snackbar.showErrorMessage('Error al publicar el libro');
          }
        })
      );
    }
  }

  toggleCategory(category: BookCategory): void {
    const index = this.newBook.category.indexOf(category);
    if (index > -1) {
      this.newBook.category.splice(index, 1);
    } else {
      this.newBook.category.push(category);
    }
  }

  isCategorySelected(category: BookCategory): boolean {
    return this.newBook.category.includes(category);
  }

  // Método para mostrar categorías con límite y "+"
  getDisplayCategories(categories: BookCategory[]): { display: BookCategory[], showPlus: boolean } {
    if (!categories || categories.length === 0) {
      return { display: [], showPlus: false };
    }
    
    console.log('Categorías del libro:', categories);
    
    if (categories.length <= 4) {
      return { display: categories, showPlus: false };
    } else {
      return { display: categories.slice(0, 4), showPlus: true };
    }
  }

  // Modal de pedido
  openOrderModal(book: Book): void {
    book.price = +book.price;
    this.selectedBook = book;
    this.orderQuantity = 1;
    this.shippingAddress = {
      street: '',
      city: '',
      country: '',
      zipCode: ''
    };
    this.showOrderModal = true;
    if (this.showDetailsModal) {
      this.closeDetailsModal();
    }
  }

  closeOrderModal(): void {
    this.showOrderModal = false;
    this.selectedBook = null;
  }

  canPlaceOrder(): boolean {
    return !!this.selectedBook && 
           this.orderQuantity > 0 && 
           this.orderQuantity <= (this.selectedBook.stock || 0) &&
           this.shippingAddress.street.trim() !== '' &&
           this.shippingAddress.city.trim() !== '' &&
           this.shippingAddress.country.trim() !== '';
  }

  placeOrder(): void {
    if (!this.canPlaceOrder() || !this.selectedBook) {
      return;
    }

    const orderData = {
      items: [{
        bookId: this.selectedBook._id,
        title: this.selectedBook.title,
        quantity: this.orderQuantity,
        unitPrice: this.selectedBook.price,
        totalPrice: this.selectedBook.price * this.orderQuantity
      }],
      shippingAddress: this.shippingAddress
    };

    console.log('Placing order:', orderData);

    this.subscription.add(
      this.ordersService.createOrder(orderData).subscribe({
        next: (response) => {
          console.log('Order placed successfully:', response);
          
          // Actualizar stock del libro
          if (this.selectedBook) {
            this.subscription.add(
              this.ordersService.updateBookStock(this.selectedBook._id, this.orderQuantity).subscribe({
                next: (stockResponse) => {
                  console.log('Stock updated successfully:', stockResponse);
                  
                  // Actualizar el stock localmente
                  if (this.selectedBook) {
                    this.selectedBook.stock = Math.max(0, (this.selectedBook.stock || 0) - this.orderQuantity);
                  }
                  
                  // Actualizar la lista de libros
                  this.updateBooksList();
                },
                error: (stockError) => {
                  console.error('Error updating stock:', stockError);
                }
              })
            );
          }
          
          this.snackbar.showSuccessMessage('Pedido realizado con éxito');
          this.closeOrderModal();
        },
        error: (error) => {
          console.error('Error placing order:', error);
          this.snackbar.showErrorMessage('Error al realizar el pedido');
        }
      })
    );
  }

  // Método para actualizar la lista de libros después de cambios
  updateBooksList(): void {
    this.subscription.add(
      this.bookService.getAll().subscribe({
        next: (books: Book[]) => {
          this.books = books;
          this.applyFilters();
          this.loadAuthors(books);
        },
        error: (error) => {
          console.error('Error updating books list:', error);
        }
      })
    );
  }

  // Método para editar libro (solo para autores)
  editBook(book: Book): void {
    if (!this.currentUser || this.currentUser.role !== 'author') {
      this.snackbar.showErrorMessage('Solo los autores pueden editar sus obras');
      return;
    }

    if (book.authorId !== this.currentUser.id && book.authorId !== this.currentUser._id) {
      this.snackbar.showErrorMessage('Solo puedes editar tus propias obras');
      return;
    }

    // Cargar datos del libro en el formulario de edición
    this.newBook = {
      title: book.title,
      description: book.description || '',
      price: book.price,
      category: [...book.category],
      language: book.language || 'Español',
      stock: book.stock || 1
    };

    this.selectedBook = book;
    this.showPublishModal = true;
  }

  // Método para eliminar libro (solo para autores)
  deleteBook(book: Book): void {
    if (!this.currentUser || this.currentUser.role !== 'author') {
      this.snackbar.showErrorMessage('Solo los autores pueden eliminar sus obras');
      return;
    }

    if (book.authorId !== this.currentUser.id && book.authorId !== this.currentUser._id) {
      this.snackbar.showErrorMessage('Solo puedes eliminar tus propias obras');
      return;
    }

    if (confirm(`¿Estás seguro de que quieres eliminar "${book.title}"? Esta acción no se puede deshacer.`)) {
      this.subscription.add(
        this.bookService.delete(book._id).subscribe({
          next: (response) => {
            console.log('Book deleted successfully:', response);
            this.snackbar.showSuccessMessage('Libro eliminado con éxito');
            this.updateBooksList();
          },
          error: (error) => {
            console.error('Error deleting book:', error);
            this.snackbar.showErrorMessage('Error al eliminar el libro');
          }
        })
      );
    }
  }

  generateBookCover(book: Book): string {
    // Si ya tiene coverUrl, usarla
    if (book.coverUrl) {
      return book.coverUrl;
    }

    // Generar imagen basada en el título y categoría
    const title = encodeURIComponent(book.title);
    const category = book.category?.[0] || 'book';
    const colors = this.getCategoryColors(category);
    
    // Usar DiceBear para generar imágenes únicas basadas en el título
    return `https://api.dicebear.com/7.x/shapes/svg?seed=${title}&backgroundColor=${colors.bg}&shape1Color=${colors.primary}&shape2Color=${colors.secondary}`;
  }

  getCategoryColors(category: string): { bg: string, primary: string, secondary: string } {
    const colorMap: { [key: string]: { bg: string, primary: string, secondary: string } } = {
      'Ficción': { bg: 'f0f8ff', primary: '4169e1', secondary: '1e3a8a' },
      'No Ficción': { bg: 'f5f5dc', primary: '8b4513', secondary: '654321' },
      'Ciencia': { bg: 'e6f3ff', primary: '00bfff', secondary: '0066cc' },
      'Tecnología': { bg: 'f0f0f0', primary: '333333', secondary: '666666' },
      'Infantil': { bg: 'fffacd', primary: 'ff69b4', secondary: 'ff1493' },
      'Historia': { bg: 'f4e4bc', primary: '8b4513', secondary: '654321' },
      'Fantasía': { bg: 'e6e6fa', primary: '9932cc', secondary: '4b0082' },
      'Romance': { bg: 'ffe4e1', primary: 'ff69b4', secondary: 'dc143c' },
      'Misterio': { bg: '2f2f2f', primary: 'ff4500', secondary: '8b0000' }
    };
    
    return colorMap[category] || { bg: 'f0f0f0', primary: '333333', secondary: '666666' };
  }

  searchBooks(): void {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) {
      this.applyFilters();
      return;
    }
    this.filteredBooks = this.books.filter(book =>
      (book.title?.toLowerCase().includes(query) ||
      book.authorName?.toLowerCase().includes(query))
    );
    this.applyFilters();
  }

  filterByCategory(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.books];
    // Filtrar por categoría
    if (this.selectedCategory) {
      filtered = filtered.filter(book =>
        book.category.includes(this.selectedCategory as any)
      );
    }
    // Filtrar por rango de precio
    if (this.selectedPriceRange) {
      const [min, max] = this.selectedPriceRange.split('-').map(Number);
      filtered = filtered.filter(book => {
        const price = book.price || 0;
        if (max) {
          return price >= min && price <= max;
        } else {
          return price >= min;
        }
      });
    }
    // Filtrar por búsqueda
    const query = this.searchQuery.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter(book =>
        (book.title?.toLowerCase().includes(query) ||
        book.authorName?.toLowerCase().includes(query))
      );
    }
    // Ordenar
    filtered.sort((a, b) => {
      switch (this.selectedSort) {
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'price-asc':
          return (a.price || 0) - (b.price || 0);
        case 'price-desc':
          return (b.price || 0) - (a.price || 0);
        case 'author':
          return (a.authorName || '').localeCompare(b.authorName || '');
        default:
          return 0;
      }
    });
    this.filteredBooks = filtered;
    this.updatePagination();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.selectedPriceRange = '';
    this.selectedSort = 'title';
    this.filteredBooks = [...this.books];
    this.updatePagination();
  }

  getPriceRangeLabel(range: string): string {
    switch (range) {
      case '0-10': return '$0 - $10';
      case '10-25': return '$10 - $25';
      case '25-50': return '$25 - $50';
      case '50-100': return '$50 - $100';
      case '100+': return '$100+';
      default: return 'Todos los precios';
    }
  }

  getSortLabel(sort: string): string {
    switch (sort) {
      case 'title': return 'Título';
      case 'price-asc': return 'Precio (menor a mayor)';
      case 'price-desc': return 'Precio (mayor a menor)';
      case 'author': return 'Autor';
      default: return 'Título';
    }
  }

  // Métodos de paginación
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredBooks.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages);
    if (this.currentPage < 1) this.currentPage = 1;
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedBooks = this.filteredBooks.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      // Mostrar todas las páginas si hay 5 o menos
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Mostrar páginas alrededor de la página actual
      let start = Math.max(1, this.currentPage - 2);
      let end = Math.min(this.totalPages, start + maxVisiblePages - 1);
      
      // Ajustar si estamos cerca del final
      if (end === this.totalPages) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }
}
