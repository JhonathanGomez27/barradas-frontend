import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ClientsService } from '../../clients.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

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
        'CONTRACT_SIGNED': 'Contrato firmado',
        'QUOTE': 'Cotización',
        'INITIAL_PAYMENT': 'Pago inicial',
    };

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        public matDialogRef: MatDialogRef<ClientDetailsComponent>,
        private clientesService : ClientsService,
        private dialog: MatDialog,
        private sanitizer: DomSanitizer
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

    // Abrir documento para previsualizar o descargar
    openDocument(file_id: string, doc_title: string, mimeType: string): void {
        if (this.canPreview(mimeType)) {
            this.previewFile(file_id, doc_title, mimeType);
        } else {
            this.downloadFile(file_id, doc_title);
        }
    }

    // Comprobar si el tipo de archivo puede ser previsualizado
    canPreview(mimeType: string): boolean {
        if (!mimeType) return false;
        return mimeType.includes('pdf') || mimeType.includes('image');
    }

    // Previsualizar archivo
    previewFile(file_id: string, doc_title: string, mimeType: string): void {
        this.clientesService.getFileUrlClient(file_id).pipe(takeUntil(this._unsubscribeAll)).subscribe(response => {
            if (response && response.blob) {
                // Abrir diálogo de previsualización para el blob
                this.openPreviewDialog(response.blob, doc_title, response.mimeType || mimeType);
            }
        });
    }

    // Descargar archivo
    downloadFile(file_id: string, doc_title: string): void {
        this.clientesService.getFileClient(file_id, doc_title);
    }

    // Abrir diálogo para previsualizar imagen
    openPreviewDialog(fileBlob: Blob, title: string, mimeType: string): void {
        // Crear una URL de objeto para el blob
        const objectUrl = URL.createObjectURL(fileBlob);

        const dialogRef = this.dialog.open(PreviewDialogComponent, {
            width: '80%',
            maxWidth: '1000px',
            maxHeight: '90vh',
            data: {
                objectUrl: objectUrl,
                blob: fileBlob,
                title: title,
                mimeType: mimeType
            }
        });

        // Limpiar la URL del objeto cuando se cierre el diálogo
        dialogRef.afterClosed().subscribe(() => {
            URL.revokeObjectURL(objectUrl);
        });
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

// Componente de diálogo para previsualizar archivos
@Component({
    selector: 'app-preview-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule
    ],
    template: `
        <div mat-dialog-title class="flex bg-primary">
            <div class="flex items-center justify-between w-full text-on-primary mt-3">
                <div class="text-lg font-medium flex items-center">
                    <mat-icon class="mr-2 text-current">{{ data.mimeType.includes('pdf') ? 'picture_as_pdf' : 'image' }}</mat-icon>
                    {{ data.title }}
                </div>
                <button mat-icon-button (click)="closeDialog()" [tabIndex]="-1">
                    <mat-icon class="text-current" [svgIcon]="'heroicons_outline:x-mark'"></mat-icon>
                </button>
            </div>
        </div>
        <mat-dialog-content class="flex flex-col items-center justify-center p-4 min-h-[50vh]">
            <img *ngIf="data.mimeType.includes('image')" [src]="data.objectUrl" class="max-w-full max-h-[70vh] object-contain" alt="{{ data.title }}">
            <iframe *ngIf="data.mimeType.includes('pdf')" [src]="safeUrl" width="100%" height="500" frameborder="0"></iframe>

            <!-- Mensaje para tipos de archivo no previsualizable -->
            <div *ngIf="!data.mimeType.includes('image') && !data.mimeType.includes('pdf')" class="text-center py-8">
                <mat-icon class="text-6xl text-gray-400">insert_drive_file</mat-icon>
                <p class="mt-4 text-gray-600">Este tipo de archivo no se puede previsualizar</p>
                <p class="text-sm text-gray-500">{{ data.mimeType }}</p>
            </div>
        </mat-dialog-content>
        <mat-dialog-actions class="justify-end py-3 px-4 bg-gray-50 border-t border-gray-200">
            <button mat-stroked-button color="accent" (click)="downloadFile()">
                <mat-icon class="mr-2">download</mat-icon>
                Descargar
            </button>
            <button mat-stroked-button class="bg-card ml-2" (click)="closeDialog()" [tabIndex]="-1">Cerrar</button>
        </mat-dialog-actions>
    `
})
export class PreviewDialogComponent {
    safeUrl: SafeResourceUrl;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        public matDialogRef: MatDialogRef<PreviewDialogComponent>,
        private sanitizer: DomSanitizer
    ) {
        // Sanitizar la URL del objeto para iframe (PDFs)
        this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(data.objectUrl);
    }

    downloadFile(): void {
        // Crear enlace de descarga y simular clic
        const a = document.createElement('a');
        a.href = this.data.objectUrl;
        a.download = this.data.title || 'documento';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    closeDialog(): void {
        this.matDialogRef.close();
    }
}
