import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ClientsService } from './clients.service';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { InviteComponent } from './modals/invite/invite.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import Swal from 'sweetalert2'
import { ClientDetailsComponent } from './modals/client-details/client-details.component';
import { environment } from 'environment/environment';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';

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
    MatDialogModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
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
    displayedColumns: string[] = ['email', 'name', 'phone', 'status', 'created_at', 'updated_at', 'actions'];
    Toast: any;

    urlComplete: string = environment.hostComplete;

    // bound al input date range
    today: Date = new Date();
    start?: Date | null;
    end?: Date | null;

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

        // Añadir filtros de fecha si están establecidos
        if( this.start && this.end) {
            if (this.start) params.createdAtStart = this.toUtcStartISO(this.start);
            if (this.end)   params.createdAtEnd   = this.toUtcEndISO(this.end);
        }

        this._clientsService.getClients(params).pipe(takeUntil(this._unsubscribeAll)).subscribe();
    }

    onFilterChange(): void {
        // this.page = 1;
        // this.loadClients();
    }

    onPageMatChange(event: any): void {
        this.page = event.pageIndex + 1;
        this.pageSize = event.pageSize;
        this.loadClients();
    }

    // Añadir método para aplicar el filtro de fechas
    applyDateFilter(): void {
        this.page = 1;
        this.loadClients();
    }

    // Método para limpiar el filtro de fechas
    clearDateFilter(): void {
        this.start = this.end = null;
        this.page = 1;
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
                    text: 'Se ha enviado una invitación al cliente a su correo electronico. Se ha copiado el enlace de invitación al portapapeles.'
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

    /**
     * Copia el enlace de completado de perfil al portapapeles
     * @param client Cliente del que se copiará el enlace
     * @param event Evento del click para prevenir la propagación
     */
    copyProfileLink(client: any, event: Event): void {
        event.stopPropagation(); // Evita que se abra el diálogo de detalles

        // Verificar si el cliente tiene enlaces
        if (client.links && client.links.length > 0) {
            const link = `${this.urlComplete}?token=${client.links[0].token}`;

            navigator.clipboard.writeText(link).then(
                () => {
                    this.Toast.fire({
                        icon: 'success',
                        title: 'Enlace copiado al portapapeles',
                        text: 'El enlace de completado de perfil ha sido copiado'
                    });
                },
                (err) => {
                    console.error('Error al copiar al portapapeles:', err);
                    this.Toast.fire({
                        icon: 'error',
                        title: 'Error al copiar al portapapeles',
                        text: 'No se pudo copiar el enlace'
                    });
                }
            );
        } else {
            this.Toast.fire({
                icon: 'warning',
                title: 'No hay enlace disponible',
                text: 'Este cliente no tiene un enlace de completado de perfil'
            });
        }
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

    private toUtcStartISO(d: Date) {
      const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0));
      return dt.toISOString(); // 2025-01-01T00:00:00.000Z
    }
    private toUtcEndISO(d: Date) {
      const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999));
      return dt.toISOString(); // 2025-08-17T23:59:59.999Z
    }
}
