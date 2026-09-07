import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Book } from '../../models/book.model';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../env/enviroment';

@Injectable({ providedIn: 'root' })
export class BookService {
  private api = environment.apiUrl + '/books';
  private booksSubject = new BehaviorSubject<Book[]>([]);
  public books$ = this.booksSubject.asObservable();

  constructor(private http: HttpClient) {}

  getAll(): Observable<Book[]> {
    return this.http.get<Book[]>(this.api).pipe(
      tap(books => {
        this.booksSubject.next(books);
      })
    );
  }

  getById(id: string): Observable<Book> {
    return this.http.get<Book>(`${this.api}/${id}`);
  }

  create(data: Partial<Book>): Observable<Book> {
    return this.http.post<Book>(this.api, data).pipe(
      tap(newBook => {
        const currentBooks = this.booksSubject.value;
        this.booksSubject.next([newBook, ...currentBooks]);
      })
    );
  }

  update(id: string, data: Partial<Book>): Observable<Book> {
    return this.http.put<Book>(`${this.api}/${id}`, data).pipe(
      tap(updatedBook => {
        const currentBooks = this.booksSubject.value;
        const updatedBooks = currentBooks.map(book => 
          book._id === id ? updatedBook : book
        );
        this.booksSubject.next(updatedBooks);
      })
    );
  }

  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.api}/${id}`).pipe(
      tap(() => {
        const currentBooks = this.booksSubject.value;
        const filteredBooks = currentBooks.filter(book => book._id !== id);
        this.booksSubject.next(filteredBooks);
      })
    );
  }
}