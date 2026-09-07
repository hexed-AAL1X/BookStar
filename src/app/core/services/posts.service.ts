import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Post } from '../../models/post.model';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../env/enviroment';

@Injectable({ providedIn: 'root' })
export class PostService {
  private api = environment.apiUrl + '/posts';
  private postsSubject = new BehaviorSubject<Post[]>([]);
  public posts$ = this.postsSubject.asObservable();

  constructor(private http: HttpClient) {}

  getAll(): Observable<Post[]> {
    return this.http.get<Post[]>(this.api).pipe(
      tap(posts => {
        this.postsSubject.next(posts);
      })
    );
  }

  getById(id: string): Observable<Post> {
    return this.http.get<Post>(`${this.api}/${id}`);
  }

  create(data: Partial<Post>): Observable<Post> {
    return this.http.post<Post>(this.api, data).pipe(
      tap(newPost => {
        const currentPosts = this.postsSubject.value;
        this.postsSubject.next([newPost, ...currentPosts]);
      })
    );
  }

  update(id: string, data: Partial<Post>): Observable<Post> {
    return this.http.put<Post>(`${this.api}/${id}`, data).pipe(
      tap(updatedPost => {
        const currentPosts = this.postsSubject.value;
        const updatedPosts = currentPosts.map(post => 
          post._id === id ? updatedPost : post
        );
        this.postsSubject.next(updatedPosts);
      })
    );
  }

  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.api}/${id}`).pipe(
      tap(() => {
        const currentPosts = this.postsSubject.value;
        const filteredPosts = currentPosts.filter(post => post._id !== id);
        this.postsSubject.next(filteredPosts);
      })
    );
  }

  addComment(postId: string, text: string): Observable<Post> {
    return this.http.post<Post>(`${this.api}/${postId}/comments`, { text });
  }

  // Eliminar un post
  deletePost(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`).pipe(
      tap(() => {
        const currentPosts = this.postsSubject.value;
        const filteredPosts = currentPosts.filter(post => post._id !== id);
        this.postsSubject.next(filteredPosts);
      })
    );
  }

  like(postId: string): Observable<any> {
    return this.http.post(`${this.api}/${postId}/like`, {}).pipe(
      tap(() => {
        const currentPosts = this.postsSubject.value;
        const updatedPosts = currentPosts.map(post => {
          if (post._id === postId) {
            // Simular que el usuario actual dio like
            const currentUserId = this.getCurrentUserId();
            const updatedLikes = [...(post.likes || []), currentUserId];
            return { ...post, likes: updatedLikes };
          }
          return post;
        });
        this.postsSubject.next(updatedPosts);
      })
    );
  }

  unlike(postId: string): Observable<any> {
    return this.http.delete(`${this.api}/${postId}/like`).pipe(
      tap(() => {
        const currentPosts = this.postsSubject.value;
        const updatedPosts = currentPosts.map(post => {
          if (post._id === postId) {
            // Simular que el usuario actual quitó el like
            const currentUserId = this.getCurrentUserId();
            const updatedLikes = (post.likes || []).filter(id => id !== currentUserId);
            return { ...post, likes: updatedLikes };
          }
          return post;
        });
        this.postsSubject.next(updatedPosts);
      })
    );
  }

  private getCurrentUserId(): string {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.id || user._id;
    }
    return '';
  }

  deleteComment(postId: string, commentId: string): Observable<Post> {
    return this.http.delete<Post>(`${this.api}/${postId}/comments/${commentId}`);
  }
}