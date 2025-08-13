import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ClientsService } from './clients.service';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';


@Component({
  selector: 'app-clients',
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss'
})
export class ClientsComponent implements OnInit, OnDestroy {
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    clients: any = [];
    totalClients: number = 0;
    page: number = 1;
    pageSize: number = 10;
    nameFilter: string = '';
    statusFilter: string = '';
    statusOptions: string[] = ['COMPLETED', 'PENDING', 'INACTIVE'];
    displayedColumns: string[] = ['email', 'name', 'phone', 'status'];

    constructor(
        private _clientsService: ClientsService,
        private _changeDetectorRef: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this._clientsService.clients$.pipe(takeUntil(this._unsubscribeAll)).subscribe((response: any) => {
            this.clients = response.data;
            this.totalClients = response.total;
            this._changeDetectorRef.markForCheck();
        });
    }

    loadClients(): void {
        const params: any = {
            page: this.page,
            limit: this.pageSize
        };
        if (this.nameFilter) {
            params.name = this.nameFilter;
        }
        if (this.statusFilter) {
            params.status = this.statusFilter;
        }
        this._clientsService.getClients(params);
    }

    onFilterChange(): void {
        this.page = 1;
        this.loadClients();
    }

    onPageMatChange(event: any): void {
        this.page = event.pageIndex + 1;
        this.pageSize = event.pageSize;
        this.loadClients();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
