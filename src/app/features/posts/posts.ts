import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PostService } from '../../core/services/posts.service';
import { Post } from '../../models/post.model';
import { BookService } from '../../core/services/books.service';
import { Book } from '../../models/book.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-posts',
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './posts.html',
  styleUrl: './posts.css'
})
export class Posts implements OnInit, OnDestroy {
  posts: Post[] = [];
  loading = false;
  userId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).id : '';
  openComments: { [postId: string]: boolean } = {};
  newCommentText: { [postId: string]: string } = {};

  // Nuevo post
  showNewPostForm = false;
  newPostTitle = '';
  newPostContent = '';
  newPostBookId = '';
  creatingPost = false;

  books: Book[] = [];

  // Paginación
  currentPage = 1;
  itemsPerPage = 4;
  totalPages = 1;
  paginatedPosts: Post[] = [];
  Math = Math; // Para usar en el template

  private subscription = new Subscription();

  constructor(private postService: PostService, private bookService: BookService) {}

  ngOnInit(): void {
    this.loadPosts();
    this.loadBooks();
    this.subscribeToPosts();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  subscribeToPosts(): void {
    this.subscription.add(
      this.postService.posts$.subscribe(posts => {
        if (posts.length > 0) {
          this.posts = posts;
          this.updatePagination();
        }
      })
    );
  }

  loadPosts(): void {
    this.loading = true;
    this.postService.getAll().subscribe({
      next: (posts) => {
        this.posts = posts;
        this.updatePagination();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading posts:', err);
        this.loading = false;
      }
    });
  }

  loadBooks(): void {
    this.bookService.getAll().subscribe({
      next: (books) => { this.books = books; },
      error: (err) => { console.error('Error loading books:', err); }
    });
  }

  hasLiked(post: Post): boolean {
    return post.likes.includes(this.userId);
  }

  toggleLike(post: Post): void {
    if (this.hasLiked(post)) {
      this.postService.unlike(post._id).subscribe({
        next: () => {
          post.likes = post.likes.filter(id => id !== this.userId);
        },
        error: (err) => {
          console.error('Error unliking post:', err);
        }
      });
    } else {
      this.postService.like(post._id).subscribe({
        next: () => {
          post.likes.push(this.userId);
        },
        error: (err) => {
          console.error('Error liking post:', err);
        }
      });
    }
  }

  toggleComments(postId: string): void {
    this.openComments[postId] = !this.openComments[postId];
  }

  addComment(post: Post): void {
    const text = (this.newCommentText[post._id] || '').trim();
    if (!text) return;
    this.postService.addComment(post._id, text).subscribe({
      next: (updatedPost: Post) => {
        post.comments = updatedPost.comments;
        this.newCommentText[post._id] = '';
      },
      error: (err: any) => {
        console.error('Error adding comment:', err);
      }
    });
  }

  openNewPostForm(): void {
    this.showNewPostForm = true;
    this.newPostTitle = '';
    this.newPostContent = '';
    this.newPostBookId = '';
  }

  closeNewPostForm(): void {
    this.showNewPostForm = false;
  }

  createPost(): void {
    if (!this.newPostTitle.trim() || !this.newPostContent.trim()) return;
    this.creatingPost = true;
    const data: any = {
      title: this.newPostTitle.trim(),
      content: this.newPostContent.trim(),
    };
    if (this.newPostBookId) data.relatedBookId = this.newPostBookId;
    this.postService.create(data).subscribe({
      next: (post) => {
        this.posts.unshift(post);
        this.updatePagination();
        this.creatingPost = false;
        this.closeNewPostForm();
      },
      error: (err) => {
        console.error('Error creating post:', err);
        this.creatingPost = false;
      }
    });
  }

  deletePost(post: Post): void {
    if (post.authorId !== this.userId) return;
    if (confirm('¿Estás seguro de que quieres eliminar este post?')) {
      this.postService.delete(post._id).subscribe({
              next: () => {
        this.posts = this.posts.filter(p => p._id !== post._id);
        this.updatePagination();
      },
        error: (err) => {
          console.error('Error deleting post:', err);
        }
      });
    }
  }

  canDeletePost(post: Post): boolean {
    return post.authorId === this.userId;
  }

  deleteComment(post: Post, comment: any): void {
    if (comment.userId !== this.userId) return;
    if (confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
      this.postService.deleteComment(post._id, comment._id).subscribe({
        next: (updatedPost: Post) => {
          post.comments = updatedPost.comments;
        },
        error: (err: any) => {
          console.error('Error deleting comment:', err);
        }
      });
    }
  }

  canDeleteComment(comment: any): boolean {
    return comment.userId === this.userId;
  }

  getBookTitle(bookId: string): string {
    const book = this.books.find(b => b._id === bookId);
    return book ? book.title : 'Libro no encontrado';
  }

  // Métodos de paginación
  updatePagination(): void {
    this.totalPages = Math.ceil(this.posts.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages);
    if (this.currentPage < 1) this.currentPage = 1;
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedPosts = this.posts.slice(startIndex, endIndex);
    
    console.log('Paginación actualizada:', {
      totalPosts: this.posts.length,
      totalPages: this.totalPages,
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage,
      paginatedPostsLength: this.paginatedPosts.length
    });
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
