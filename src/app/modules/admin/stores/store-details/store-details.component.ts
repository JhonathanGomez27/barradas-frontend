import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { StoresService, Store, City } from '../stores.service';
import { AgentsService, Agent } from '../agents.service';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { AgentFormDialogComponent } from './agent-form-dialog/agent-form-dialog.component';
import { environment } from 'environment/environment';
import { FuseConfirmationService } from '@fuse/services/confirmation';

@Component({
    selector: 'app-store-details',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        MatProgressSpinnerModule,
        MatCardModule,
        MatDividerModule,
        MatTabsModule,
        MatTableModule,
        MatPaginatorModule,
        MatFormFieldModule,
        MatInputModule,
        MatDialogModule,
        MatSnackBarModule,
        CdkScrollable
    ],
    templateUrl: './store-details.component.html'
})
export class StoreDetailsComponent implements OnInit, OnDestroy {
    store: Store | null = null;
    city: City | null = null;
    isLoading = false;

    // Agentes
    agents: Agent[] = [];
    isLoadingAgents = false;
    totalAgents = 0;
    pageSize = environment.pagination;
    currentPage = 1;
    pageSizeOptions = [5, 10, 20, 25];
    searchTerm = '';
    displayedColumns: string[] = ['name', 'email', 'phone', 'actions'];

    private destroy$ = new Subject<void>();
    private searchSubject$ = new Subject<string>();

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private storesService: StoresService,
        private agentsService: AgentsService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService
    ) { }

    ngOnInit(): void {
        const storeId = this.route.snapshot.params['id'];

        if (storeId) {
            this.storesService.store$.pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
                this.store = response;
                this._changeDetectorRef.markForCheck();
            });

            this.agentsService.agents$.pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
                this.agents = response;
                this.isLoadingAgents = false;
                this._changeDetectorRef.markForCheck();
            });

            this.agentsService.pagination$.pipe(takeUntil(this.destroy$)).subscribe(total => {
                this.totalAgents = total.total;
            });

            // Setup search debounce
            this.searchSubject$.pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$)).subscribe(searchTerm => {
                this.currentPage = 1;
                this.loadAgents();
            });


        } else {
            this.router.navigate(['/stores']);
        }
    }

    goBack(): void {
        this.router.navigate(['/stores']);
    }

    // ===== AGENTS METHODS =====

    loadAgents(): void {
        if (!this.store?.id) return;

        this.isLoadingAgents = true;
        this.agentsService.getAgents({ page: this.currentPage, limit: this.pageSize, search: this.searchTerm}).pipe(takeUntil(this.destroy$)).subscribe();
    }

    onSearchChange(searchValue: string): void {
        this.searchTerm = searchValue;
        this.searchSubject$.next(searchValue);
    }

    clearSearch(): void {
        this.searchTerm = '';
        this.searchSubject$.next('');
    }

    onPageChange(event: PageEvent): void {
        this.currentPage = event.pageIndex + 1;
        this.pageSize = event.pageSize;
        this.loadAgents();
    }

    openAgentDialog(agent: Agent | null = null): void {
        if (!this.store?.id) return;

        const dialogRef = this.dialog.open(AgentFormDialogComponent, {
            width: '600px',
            maxWidth: '95vw',
            disableClose: true,
            data: {
                agent: agent,
                storeId: this.store.id
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.saveAgent(result, agent);
            }
        });
    }

    saveAgent(formValue: any, existingAgent: Agent | null): void {
        const operation = existingAgent
            ? this.agentsService.updateAgent(existingAgent.id!, formValue)
            : this.agentsService.createAgent(formValue);

        operation
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    const message = existingAgent
                        ? 'Agente actualizado correctamente'
                        : 'Agente creado correctamente';
                    this.snackBar.open(message, 'Cerrar', { duration: 3000 });
                    this.loadAgents();
                },
                error: (error) => {
                    console.error('Error saving agent:', error);
                    this.snackBar.open('Error al guardar el agente', 'Cerrar', { duration: 3000 });
                }
            });
    }

    deleteAgent(agent: Agent): void {
        const confirmation = this._fuseConfirmationService.open({
            title: 'Eliminar Agente',
            message: `¿Estás seguro de que deseas eliminar al agente ${agent.firstName} ${agent.lastName}?`,
            icon: {
                show: true,
                name: 'heroicons_outline:exclamation-triangle',
                color: 'warn'
            },
            actions: {
                confirm: {
                    show: true,
                    label: 'Eliminar',
                    color: 'warn'
                },
                cancel: {
                    show: true,
                    label: 'Cancelar'
                }
            }
        });

        confirmation.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                this.agentsService.deleteAgent(agent.id!)
                    .pipe(takeUntil(this.destroy$))
                    .subscribe({
                        next: () => {
                            this.snackBar.open('Agente eliminado correctamente', 'Cerrar', { duration: 3000 });
                            this.loadAgents();
                        },
                        error: (error) => {
                            console.error('Error deleting agent:', error);
                            this.snackBar.open('Error al eliminar el agente', 'Cerrar', { duration: 3000 });
                        }
                    });
            }
        });
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
