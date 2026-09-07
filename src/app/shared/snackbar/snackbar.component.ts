import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SnackbarService, SnackbarData } from '../../core/services/snackbar.service';
import { Subscription } from 'rxjs';

export type SnackbarType = 'success' | 'error' | 'warning';

@Component({
  selector: 'app-snackbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      *ngIf="isVisible" 
      class="snackbar"
      [class]="'snackbar-' + currentType">
      <div class="snackbar-content">
        <div class="snackbar-icon">
          <span *ngIf="currentType === 'success'">✅</span>
          <span *ngIf="currentType === 'error'">❌</span>
          <span *ngIf="currentType === 'warning'">⚠️</span>
        </div>
        <div class="snackbar-message">
          <h4 class="snackbar-title">{{ currentTitle }}</h4>
          <p class="snackbar-text">{{ currentMessage }}</p>
        </div>
        <button class="snackbar-close" (click)="hide()">
          <span>✕</span>
        </button>
      </div>
      <div class="snackbar-progress" [style.width.%]="progressWidth"></div>
    </div>
  `,
  styleUrls: ['./snackbar.component.css']
})
export class SnackbarComponent implements OnInit, OnDestroy {
  isVisible = false;
  currentType: SnackbarType = 'success';
  currentTitle = '';
  currentMessage = '';
  progressWidth = 100;
  private subscription = new Subscription();
  private progressInterval: any;

  constructor(private snackbarService: SnackbarService) {}

  ngOnInit(): void {
    this.subscription.add(
      this.snackbarService.snackbar$.subscribe((data: SnackbarData | null) => {
        if (data) {
          this.show(data);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
  }

  show(data: SnackbarData): void {
    this.currentType = data.type;
    this.currentTitle = data.title;
    this.currentMessage = data.message;
    this.isVisible = true;
    this.progressWidth = 100;

    // Auto-hide después del tiempo especificado
    if (data.duration && data.duration > 0) {
      this.startProgress(data.duration);
      setTimeout(() => {
        this.hide();
      }, data.duration);
    }
  }

  hide(): void {
    this.isVisible = false;
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
  }

  private startProgress(duration: number): void {
    const interval = 50; // Actualizar cada 50ms
    const steps = duration / interval;
    const decrement = 100 / steps;

    this.progressInterval = setInterval(() => {
      this.progressWidth -= decrement;
      if (this.progressWidth <= 0) {
        clearInterval(this.progressInterval);
      }
    }, interval);
  }
} 