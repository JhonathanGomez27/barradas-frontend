import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StoresService, Store, City } from './stores.service';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { environment } from 'environment/environment';
import { StoreFormDialogComponent } from './store-form-dialog/store-form-dialog.component';

@Component({
  selector: 'app-stores',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatTableModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatTooltipModule
  ],
  templateUrl: './stores.component.html',
  styleUrl: './stores.component.scss'
})
export class StoresComponent implements OnInit, OnDestroy {

    private _unsubscribeAll: Subject<any> = new Subject<any>();

  stores: Store[] = [];
  cities: City[] = [];
  isLoading = false;

  // Pagination
  totalItems = 0;
  pageSize = environment.pagination;
  currentPage = 1;
  pageSizeOptions = [5, 10, 20, 25, 50];
  searchTerm = '';

  displayedColumns: string[] = ['name', 'address', 'city', 'actions'];

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  constructor(
    private storesService: StoresService,
    private snackBar: MatSnackBar,
    private _changeDetectorRef: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadStores();

    this.storesService.stores$.pipe(takeUntil(this._unsubscribeAll)).subscribe((response: any) => {
        this.stores = response;
        this._changeDetectorRef.markForCheck();
    });

    // Subscribe to cities changes
    this.storesService.cities$
      .pipe(takeUntil(this.destroy$))
      .subscribe(cities => {
        this.cities = cities;
      });

    // Subscribe to pagination changes
    this.storesService.pagination$
      .pipe(takeUntil(this.destroy$))
      .subscribe(pagination => {
        this.totalItems = pagination.total;
        this.currentPage = pagination.page;
        this.pageSize = pagination.limit;
      });

    // Setup search with debounce
    this.searchSubject$
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.currentPage = 1;
        this.loadStores();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStores(): void {
    this.storesService.getStores({
      page: this.currentPage,
      limit: this.pageSize,
      search: this.searchTerm || undefined
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading stores:', error);
          this.snackBar.open('Error al cargar las tiendas', 'Cerrar', { duration: 3000 });
          this.isLoading = false;
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadStores();
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.searchSubject$.next(value);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchSubject$.next('');
  }

  openStoreDialog(store: Store | null = null): void {
    const dialogRef = this.dialog.open(StoreFormDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      disableClose: true,
      data: {
        store: store,
        cities: this.cities
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.saveStore(result, store);
      }
    });
  }

  saveStore(formValue: any, existingStore: Store | null): void {
    const operation = existingStore
      ? this.storesService.updateStore(existingStore.id!, formValue)
      : this.storesService.createStore(formValue);

    operation
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const message = existingStore
            ? 'Tienda actualizada correctamente'
            : 'Tienda creada correctamente';
          this.snackBar.open(message, 'Cerrar', { duration: 3000 });
          this.loadStores();
        },
        error: (error) => {
          console.error('Error saving store:', error);
          this.snackBar.open('Error al guardar la tienda', 'Cerrar', { duration: 3000 });
        }
      });
  }

  editStore(store: Store): void {
    this.openStoreDialog(store);
  }

  getCityName(cityId: string): string {
    const city = this.cities.find(c => c.id === cityId);
    return city ? city.name : 'N/A';
  }
}
