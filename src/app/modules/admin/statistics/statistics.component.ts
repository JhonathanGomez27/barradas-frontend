import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApexAxisChartSeries, ApexChart, ApexDataLabels, ApexFill, ApexGrid, ApexLegend, ApexNonAxisChartSeries, ApexPlotOptions, ApexResponsive, ApexStroke, ApexTitleSubtitle, ApexTooltip, ApexXAxis, ApexYAxis, ChartComponent, NgApexchartsModule } from 'ng-apexcharts';
import { ReplaySubject, Subject, takeUntil } from 'rxjs';
import { StatisticsService } from './statistics.service';
import { AgentCreditEntry, AgentCreditStatsResponse, AgentPerformanceEntry, AgentPerformanceResponse, ClientStatus, CreditStatus, DashboardStatsResponse } from './statistics.types';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { Store, StoresService } from '../stores/stores.service';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

export type ChartOptions = {
  series: ApexAxisChartSeries | ApexNonAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  labels: string[];
  legend: ApexLegend;
  colors: string[];
  title: ApexTitleSubtitle;
  yaxis: ApexYAxis;
  fill: ApexFill;
  responsive: ApexResponsive[];
  grid: ApexGrid;
};

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressBarModule,
    NgApexchartsModule,
    // FuseCardComponent,
    ScrollingModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './statistics.component.html'
})
export class StatisticsComponent implements OnInit, OnDestroy {
  @ViewChild('chart') chart: ChartComponent;

  clientStats: any;
  creditStats: any;
  storeStats: any;
  dashboardStats: DashboardStatsResponse | null = null;
  agentCreditStats: AgentCreditStatsResponse | null = null;
  agentPerformanceStats: AgentPerformanceResponse | null = null;

  clientChartOptions: Partial<ChartOptions>;
  creditChartOptions: Partial<ChartOptions>;
  agentCreditsChartOptions: Partial<ChartOptions>;

  filterForm: FormGroup;
  clientStatuses: ClientStatus[] = ['CREATED', 'INVITED', 'IN_PROGRESS', 'NO_CONTRACT_SENDED', 'CONTRACT_SENDED', 'COMPLETED'];
  creditStatuses: CreditStatus[] = ['PENDING', 'ACTIVE', 'CLOSED', 'COMPLETED', 'DEFAULTED', 'CANCELLED'];

  statusMapper: { [key: string]: string } = {
    'CREATED': 'Creado',
    'INVITED': 'Invitación enviada',
    'IN_PROGRESS': 'Pendiente de completar Documentación',
    'COMPLETED': 'Finalizado con contrato',
    'NO_CONTRACT_SENDED': 'Gestionado sin contrato',
    'CONTRACT_SENDED': 'Gestionado con contrato sin firmar'
  };

  statusCreditsMapper: { [key: string]: string } = {
    'PENDING': 'Pendiente',
    'ACTIVE': 'Activo',
    'CLOSED': 'Pagado',
    'COMPLETED': 'Completado',
    'DEFAULTED': 'En Mora',
    'CANCELLED': 'Cancelado'
  };

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  stores: Store[] = [];
  storeFilter: string = '';
  storeFilterCtrl: FormControl = new FormControl('');
  filteredStores: ReplaySubject<Store[]> = new ReplaySubject<Store[]>(1);

  constructor(
    private _statisticsService: StatisticsService,
    private _changeDetectorRef: ChangeDetectorRef,
    private _snackBar: MatSnackBar,
    private _storesService: StoresService
  ) {
    this.clientChartOptions = {
      series: [],
      chart: {
        type: 'donut',
        height: 350,
        fontFamily: 'Inter, sans-serif',
        toolbar: {
          show: false
        }
      },
      labels: [],
      colors: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#f97316', '#6b7280'],
      legend: {
        position: 'bottom',
        fontSize: '14px',
        fontWeight: 500,
        itemMargin: {
          horizontal: 10,
          vertical: 5
        }
      },
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '16px',
                fontWeight: 600,
                color: '#374151'
              },
              value: {
                show: true,
                fontSize: '24px',
                fontWeight: 700,
                color: '#111827',
                formatter: function (val) {
                  return val.toString();
                }
              },
              total: {
                show: true,
                label: 'Total',
                fontSize: '14px',
                fontWeight: 500,
                color: '#6b7280',
                formatter: function (w) {
                  return w.globals.seriesTotals.reduce((a: number, b: number) => {
                    return a + b;
                  }, 0).toString();
                }
              }
            }
          }
        }
      },
      dataLabels: {
        enabled: true,
        style: {
          fontSize: '12px',
          fontWeight: 600
        },
        dropShadow: {
          enabled: false
        }
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 280
            },
            legend: {
              position: 'bottom',
              fontSize: '12px'
            }
          }
        }
      ]
    };

    this.creditChartOptions = {
      series: [],
      chart: {
        type: 'bar',
        height: 350,
        fontFamily: 'Inter, sans-serif',
        toolbar: {
          show: false
        }
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 8,
          dataLabels: {
            position: 'top'
          }
        }
      },
      colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280'],
      dataLabels: {
        enabled: true,
        offsetX: 30,
        style: {
          fontSize: '12px',
          fontWeight: 600,
          colors: ['#374151']
        }
      },
      stroke: {
        show: true,
        width: 1,
        colors: ['transparent']
      },
      xaxis: {
        categories: [],
        labels: {
          style: {
            fontSize: '12px',
            fontWeight: 500,
            colors: '#6b7280'
          }
        }
      },
      yaxis: {
        labels: {
          style: {
            fontSize: '12px',
            fontWeight: 500,
            colors: '#6b7280'
          }
        }
      },
      grid: {
        borderColor: '#e5e7eb',
        strokeDashArray: 4,
        xaxis: {
          lines: {
            show: true
          }
        },
        yaxis: {
          lines: {
            show: false
          }
        }
      },
      tooltip: {
        theme: 'light',
        style: {
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif'
        },
        y: {
          formatter: function (val) {
            return val + " créditos";
          }
        }
      }
    };

    this.agentCreditsChartOptions = {
      series: [],
      chart: {
        type: 'bar',
        height: 360,
        stacked: true,
        fontFamily: 'Inter, sans-serif',
        toolbar: {
          show: false
        }
      },
      plotOptions: {
        bar: {
          borderRadius: 6,
          horizontal: false,
          columnWidth: '55%'
        }
      },
      dataLabels: {
        enabled: false
      },
      xaxis: {
        categories: [],
        labels: {
          rotate: -30,
          style: {
            fontSize: '12px',
            fontWeight: 500,
            colors: '#6b7280'
          }
        }
      },
      yaxis: {
        labels: {
          style: {
            fontSize: '12px',
            fontWeight: 500,
            colors: '#6b7280'
          }
        }
      },
      legend: {
        position: 'top',
        fontSize: '13px',
        fontWeight: 500
      },
      colors: ['#0f766e', '#2563eb', '#22c55e'],
      grid: {
        borderColor: '#e5e7eb',
        strokeDashArray: 4
      }
    };
  }

  ngOnInit(): void {
    this.filterForm = new FormGroup({
      storeId: new FormControl(null),
      startDate: new FormControl(null),
      endDate: new FormControl(null),
      clientStatus: new FormControl(null),
      creditStatus: new FormControl(null)
    });

    this.loadAllSections();

    this.filterForm.valueChanges
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(() => {
        this.loadAllSections();
      });

    this._storesService.allStores$.pipe(takeUntil(this._unsubscribeAll)).subscribe((response: Store[]) => {
      this.stores = response;
      this.filteredStores.next(this.stores.slice());
      this._changeDetectorRef.markForCheck();
    })
    // Listen for search field value changes
    this.storeFilterCtrl.valueChanges.pipe(takeUntil(this._unsubscribeAll)).subscribe(() => {
      this.filterStores();
      this._changeDetectorRef.markForCheck();
    });
  }

  loadAllSections(): void {
    const baseFilters = this.buildBaseFilters();
    this.loadClientStats(baseFilters);
    this.loadCreditStats(baseFilters);
    this.loadStoreStats(baseFilters);
    this.loadDashboardStats(baseFilters);
    this.loadAgentCredits(baseFilters);
    this.loadAgentPerformance(baseFilters);
  }

  private buildBaseFilters() {
    const filters = this.filterForm.value;
    return {
      storeId: filters.storeId || undefined,
      clientStatus: filters.clientStatus || undefined,
      creditStatus: filters.creditStatus || undefined,
      startDate: filters.startDate ? filters.startDate.toISOString() : undefined,
      endDate: filters.endDate ? filters.endDate.toISOString() : undefined
    };
  }

  private loadClientStats(baseFilters: any): void {
    this._statisticsService.getClientsStatistics({
      storeId: baseFilters.storeId,
      clientStatus: baseFilters.clientStatus,
      status: baseFilters.clientStatus,
      startDate: baseFilters.startDate,
      endDate: baseFilters.endDate
    }).pipe(takeUntil(this._unsubscribeAll)).subscribe({
      next: (res) => {
        this.clientStats = res;
        this.updateClientChart(res);
        this._changeDetectorRef.markForCheck();
      },
      error: (err) => {
        console.error(err);
        this.showError('Error cargando estadísticas de clientes');
      }
    });
  }

  private loadCreditStats(baseFilters: any): void {
    this._statisticsService.getCreditsStatistics({
      storeId: baseFilters.storeId,
      creditStatus: baseFilters.creditStatus,
      status: baseFilters.creditStatus,
      startDate: baseFilters.startDate,
      endDate: baseFilters.endDate
    }).pipe(takeUntil(this._unsubscribeAll)).subscribe({
      next: (res) => {
        this.creditStats = res;
        this.updateCreditChart(res);
        this._changeDetectorRef.markForCheck();
      },
      error: (err) => {
        console.error(err);
        this.showError('Error cargando estadísticas de créditos');
      }
    });
  }

  private loadStoreStats(baseFilters: any): void {
    this._statisticsService.getStoresStatistics({
      storeId: baseFilters.storeId,
      clientStatus: baseFilters.clientStatus,
      creditStatus: baseFilters.creditStatus,
      startDate: baseFilters.startDate,
      endDate: baseFilters.endDate
    }).pipe(takeUntil(this._unsubscribeAll)).subscribe({
      next: (res) => {
        this.storeStats = res;
        this._changeDetectorRef.markForCheck();
      },
      error: (err) => {
        console.error(err);
        this.showError('Error cargando estadísticas de tiendas');
      }
    });
  }

  private loadDashboardStats(baseFilters: any): void {
    this._statisticsService.getDashboardStatistics({
      storeId: baseFilters.storeId,
      startDate: baseFilters.startDate,
      endDate: baseFilters.endDate
    }).pipe(takeUntil(this._unsubscribeAll)).subscribe({
      next: (res) => {
        this.dashboardStats = res;
        this._changeDetectorRef.markForCheck();
      },
      error: (err) => {
        console.error(err);
        this.showError('Error cargando el resumen general');
      }
    });
  }

  private loadAgentCredits(baseFilters: any): void {
    this._statisticsService.getAgentCreditsStatistics({
      storeId: baseFilters.storeId,
      creditStatus: baseFilters.creditStatus,
      startDate: baseFilters.startDate,
      endDate: baseFilters.endDate
    }).pipe(takeUntil(this._unsubscribeAll)).subscribe({
      next: (res) => {
        this.agentCreditStats = res;
        this.updateAgentCreditsChart(res);
        this._changeDetectorRef.markForCheck();
      },
      error: (err) => {
        console.error(err);
        this.showError('Error cargando créditos por agente');
      }
    });
  }

  private loadAgentPerformance(baseFilters: any): void {
    this._statisticsService.getAgentPerformanceStatistics({
      storeId: baseFilters.storeId,
      startDate: baseFilters.startDate,
      endDate: baseFilters.endDate
    }).pipe(takeUntil(this._unsubscribeAll)).subscribe({
      next: (res) => {
        this.agentPerformanceStats = res;
        this._changeDetectorRef.markForCheck();
      },
      error: (err) => {
        console.error(err);
        this.showError('Error cargando rendimiento de agentes');
      }
    });
  }

  updateClientChart(data: any): void {
    if (data && data.statuses) {
      this.clientChartOptions.series = data.statuses.map((s: any) => s.count);
      this.clientChartOptions.labels = data.statuses.map((s: any) => this.statusMapper[s.status] || s.status);
    }
  }

  updateCreditChart(data: any): void {
    if (data && data.statuses) {
      this.creditChartOptions.series = [{
        name: 'Créditos',
        data: data.statuses.map((s: any) => s.count)
      }];
      this.creditChartOptions.xaxis = {
        categories: data.statuses.map((s: any) => this.statusCreditsMapper[s.status] || s.status)
      };
    }
  }

  private updateAgentCreditsChart(data: AgentCreditStatsResponse): void {
    if (!data || !data.agents || !data.agents.length) {
      this.agentCreditsChartOptions.series = [];
      this.agentCreditsChartOptions.xaxis = { categories: [] };
      return;
    }

    const categories = data.agents.map(agent => `${agent.firstName} ${agent.lastName}`);
    const totalSeries = data.agents.map(agent => agent.credits.total);
    const activeSeries = data.agents.map(agent => this.getCreditCount(agent, 'ACTIVE'));
    const completedSeries = data.agents.map(agent => this.getCreditCountForStatuses(agent, ['CLOSED']));

    this.agentCreditsChartOptions.series = [
      { name: 'Total créditos', data: totalSeries },
      { name: 'Activos', data: activeSeries },
      { name: 'Completados', data: completedSeries }
    ];
    this.agentCreditsChartOptions.xaxis = {
      categories,
      labels: this.agentCreditsChartOptions.xaxis?.labels
    };
  }

  private getCreditCount(agent: AgentCreditEntry, status: CreditStatus): number {
    return agent.credits.byStatus.find(s => s.status === status)?.count || 0;
  }

  private getCreditCountForStatuses(agent: AgentCreditEntry, statuses: CreditStatus[]): number {
    return statuses.reduce((total, status) => total + this.getCreditCount(agent, status), 0);
  }

  hasSeriesData(options: Partial<ChartOptions>): boolean {
    if (!options || !options.series || options.series.length === 0) {
      return false;
    }
    const series = options.series;
    if (typeof series[0] === 'object' && 'data' in series[0]) {
      const axisSeries = series as ApexAxisChartSeries;
      return axisSeries[0].data && axisSeries[0].data.length > 0;
    }
    if (typeof series[0] === 'number') {
      return true;
    }
    return false;
  }

  formatCurrency(value?: number): string {
    if (value === null || value === undefined) {
      return '$0';
    }
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(value);
  }

  formatPercent(value?: number): string {
    if (value === null || value === undefined) {
      return '0%';
    }
    return `${value.toFixed(1)}%`;
  }

  getClientsCompletionRate(): number {
    if (!this.dashboardStats?.clients?.total) {
      return 0;
    }
    return (this.dashboardStats.clients.completed / this.dashboardStats.clients.total) * 100;
  }

  getCreditsActiveRate(): number {
    if (!this.dashboardStats?.credits?.total) {
      return 0;
    }
    return (this.dashboardStats.credits.active / this.dashboardStats.credits.total) * 100;
  }

  getClientStatusClasses(status: ClientStatus): string {
    const mapper = {
      'COMPLETED': 'bg-green-100 text-green-800',
      'IN_PROGRESS': 'bg-yellow-100 text-yellow-800',
      'INVITED': 'bg-blue-100 text-blue-800',
      'CREATED': 'bg-gray-100 text-gray-800',
      'NO_CONTRACT_SENDED': 'bg-violet-100 text-violet-800',
      'CONTRACT_SENDED': 'bg-orange-100 text-orange-800'
    } as Record<string, string>;
    return mapper[status] || 'bg-gray-100 text-gray-800';
  }

  getCreditStatusClasses(status: CreditStatus): string {
    const mapper = {
      'ACTIVE': 'bg-blue-100 text-blue-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'CLOSED': 'bg-emerald-100 text-emerald-800',
      'COMPLETED': 'bg-emerald-100 text-emerald-800',
      'DEFAULTED': 'bg-red-100 text-red-800',
      'CANCELLED': 'bg-gray-100 text-gray-800'
    } as Record<string, string>;
    return mapper[status] || 'bg-gray-100 text-gray-800';
  }

  getAgentDisplayName(firstName?: string, lastName?: string): string {
    return `${firstName || ''} ${lastName || ''}`.trim() || 'Sin nombre';
  }

  trackByStore(index: number, store: any): string {
    return store?.id || index;
  }

  trackByAgent(index: number, agent: AgentPerformanceEntry): string {
    return agent?.id || index.toString();
  }

  showError(message: string): void {
    this._snackBar.open(message, 'Cerrar', { duration: 3000 });
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  // Método para filtrar tiendas en el select con búsqueda
  private filterStores(): void {
    if (!this.stores) {
      return;
    }
    // Get the search keyword
    let search = this.storeFilterCtrl.value;
    if (!search) {
      this.filteredStores.next(this.stores.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    // Filter the stores
    this.filteredStores.next(
      this.stores.filter(store => store.name.toLowerCase().indexOf(search) > -1)
    );
  }
}
