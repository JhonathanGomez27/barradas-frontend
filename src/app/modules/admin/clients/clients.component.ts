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
import { MatDialog } from '@angular/material/dialog';
import { InviteComponent } from './modals/invite/invite.component';
import { MatDialogModule } from '@angular/material/dialog';
import Swal from 'sweetalert2'
import { ClientDetailsComponent } from './modals/client-details/client-details.component';

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
    MatIconModule,
    MatDialogModule
  ],
  templateUrl: './clients.component.html'
})
export class ClientsComponent implements OnInit, OnDestroy {
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    clients: any = [];
    totalClients: number = 0;
    page: number = 1;
    pageSize: number = 10;
    nameFilter: string = '';
    statusFilter: string = '';
    statusOptions: string[] = ['CREATED', 'INVITED', 'IN_PROGRESS', 'COMPLETED'];
    statusMapper: { [key: string]: string } = {
        'CREATED': 'Creado',
        'INVITED': 'Invitado',
        'IN_PROGRESS': 'En Progreso',
        'COMPLETED': 'Completado'
    };
    displayedColumns: string[] = ['email', 'name', 'phone', 'status'];

    Toast: any;

    constructor(
        private _clientsService: ClientsService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _dialog: MatDialog
    ) {
        this.Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            },
        });
    }

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

        this._clientsService.getClients(params).pipe(takeUntil(this._unsubscribeAll)).subscribe();
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

    openInviteDialog(): void {
        const dialogRef = this._dialog.open(InviteComponent, {
            width: '500px',
            disableClose: true
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                // Aquí puedes manejar los datos del formulario
                console.log('Cliente invitado:', result);
                this.Toast.fire({
                    icon: 'success',
                    title: 'Cliente invitado exitosamente',
                    text: 'Se ha enviado una invitación al cliente a su correo electronico.'
                });
                this.page = 1;
                this.loadClients();
            }
        });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    onClick(row: any): void {
        this.obtenerDetallesCliente(row.id);
    }

    obtenerDetallesCliente(client_id: string): void {
        this._clientsService.getClient(client_id).pipe(takeUntil(this._unsubscribeAll)).subscribe({
            next: (response:any) => {
                this._dialog.open(ClientDetailsComponent, {
                    data: response,
                    // width: '600px's
                });
            },error: (error) => {
                this.Toast.fire({
                    icon: 'error',
                    title: 'Error al obtener detalles del cliente'
                });
            }
        });
    }
}
