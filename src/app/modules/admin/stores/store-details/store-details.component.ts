import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, takeUntil } from 'rxjs';
import { StoresService, Store, City } from '../stores.service';
import { CdkScrollable } from '@angular/cdk/scrolling';

@Component({
  selector: 'app-store-details',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatDividerModule,
    CdkScrollable
  ],
  templateUrl: './store-details.component.html'
})
export class StoreDetailsComponent implements OnInit, OnDestroy {
  store: Store | null = null;
  city: City | null = null;
  isLoading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private storesService: StoresService
  ) {}

  ngOnInit(): void {
    const storeId = this.route.snapshot.params['id'];

    if (storeId) {
      this.loadStoreDetails(storeId);
    } else {
      this.router.navigate(['/admin/stores']);
    }
  }

  loadStoreDetails(storeId: string): void {
    this.isLoading = true;
    this.storesService.getStoreById(storeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (store: Store) => {
          this.store = store;
          this.loadCityDetails(store.cityId);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al cargar detalles de la tienda:', error);
          this.isLoading = false;
          this.router.navigate(['/admin/stores']);
        }
      });
  }

  loadCityDetails(cityId: string): void {
    this.storesService.cities$
      .pipe(takeUntil(this.destroy$))
      .subscribe(cities => {
        this.city = cities.find(c => c.id === cityId) || null;
      });
  }

  goBack(): void {
    this.router.navigate(['/admin/stores']);
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
