import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ClientsService } from '../../clients.service';

@Component({
  selector: 'app-client-details',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './client-details.component.html'
})
export class ClientDetailsComponent implements OnInit, OnDestroy{

    private _unsubscribeAll: Subject<any> = new Subject<any>();
    clientDetails: any = null;

    // Mapeo de estados
    statusMapper: { [key: string]: string } = {
        'CREATED': 'Creado',
        'INVITED': 'Invitado',
        'IN_PROGRESS': 'En Progreso',
        'COMPLETED': 'Completado'
    };

    // Mapeo de tipos de documento
    docTypeMapper: { [key: string]: string } = {
        'INTERIOR_1': 'Interior 1',
        'INTERIOR_2': 'Interior 2',
        'INE_FRONT': 'INE (Frente)',
        'INE_BACK': 'INE (Reverso)',
        'PROOF_ADDRESS': 'Comprobante de domicilio',
        'PROOF_ADDRESS_OWNER': 'Comprobante del propietario',
        'FACADE': 'Fachada',
        'CONTRACT_SIGNED': 'Contrato firmado'
    };

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        public matDialogRef: MatDialogRef<ClientDetailsComponent>,
        private clientesService : ClientsService
    ) { }

    ngOnInit(): void {
        this.clientDetails = this.data;
        console.log(this.clientDetails);
    }

    // Formatear fecha
    formatDate(dateString: string): string {
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

    // Obtener tamaño de archivo en formato legible
    getFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Abrir documento en nueva pestaña
    openDocument(file_id: string, doc_title: string): void {
        this.getFile(file_id, doc_title);
    }

    // Obtener tipo de icono basado en el tipo MIME
    getFileIcon(mimeType: string): string {
        if (mimeType?.includes('pdf')) {
            return 'picture_as_pdf';
        } else if (mimeType?.includes('image')) {
            return 'image';
        } else {
            return 'insert_drive_file';
        }
    }

    getFile(file_id: string, doc_title: string){
        this.clientesService.getFileClient(file_id, doc_title);
    }

    // Cerrar el diálogo
    closeDialog(): void {
        this.matDialogRef.close();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
