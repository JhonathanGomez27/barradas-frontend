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
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { ApexAxisChartSeries, ApexAnnotations, ApexChart, ApexDataLabels, ApexFill, ApexGrid, ApexLegend, ApexNonAxisChartSeries, ApexPlotOptions, ApexResponsive, ApexStroke, ApexTitleSubtitle, ApexTooltip, ApexXAxis, ApexYAxis, ChartComponent, NgApexchartsModule } from 'ng-apexcharts';
import { ReplaySubject, Subject, takeUntil } from 'rxjs';
import { StatisticsService } from './statistics.service';
import { AgentCreditEntry, AgentCreditStatsResponse, AgentPerformanceEntry, AgentPerformanceResponse, AlertItem, AlertsStatsResponse, ClientStatus, ClientStatusEntry, CollectionStatsResponse, CommercialStatsResponse, CreditStatus, DashboardStatsResponse, PaymentType, PortfolioStatsResponse, SummaryStatsResponse, TrendStatsResponse } from './statistics.types';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { Store, StoresService } from '../stores/stores.service';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { UserService } from 'app/core/user/user.service';
import { User } from 'app/core/user/user.types';
import { PermissionService } from 'app/shared/services/permission.service';

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
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatTooltipModule,
    NgApexchartsModule,
    ScrollingModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './statistics.component.html'
})
export class StatisticsComponent implements OnInit, OnDestroy {
  @ViewChild('chart') chart: ChartComponent | undefined;

  // ── Existing data ───────────────────────────────────────────────────────────
  clientStats: any;
  creditStats: any;
  storeStats: any;
  dashboardStats: DashboardStatsResponse | null = null;
  agentCreditStats: AgentCreditStatsResponse | null = null;
  agentPerformanceStats: AgentPerformanceResponse | null = null;

  // ── New data (Dashboard Guide) ──────────────────────────────────────────────
  summaryStats: SummaryStatsResponse | null = null;
  trendStats: TrendStatsResponse | null = null;
  commercialStats: CommercialStatsResponse | null = null;
  portfolioStats: PortfolioStatsResponse | null = null;
  collectionStats: CollectionStatsResponse | null = null;
  alertsStats: AlertsStatsResponse | null = null;
  alertsOpen: boolean = true;
  performanceOpen: boolean = true;
  storesOpen: boolean = true;

  // ── Chart options ───────────────────────────────────────────────────────────
  clientChartOptions: Partial<ChartOptions>;
  creditChartOptions: Partial<ChartOptions>;
  agentCreditsChartOptions: Partial<ChartOptions>;
  trendChartOptions: Partial<ChartOptions>;
  commercialStoreChartOptions: Partial<ChartOptions>;
  commercialAgentChartOptions: Partial<ChartOptions>;
  collectionChartOptions: Partial<ChartOptions>;

  filterForm: FormGroup = new FormGroup({ });
  clientStatuses: ClientStatus[] = ['CREATED', 'INVITED', 'IN_PROGRESS', 'NO_CONTRACT_SENDED', 'CONTRACT_SENDED', 'COMPLETED'];
  clientStatusesMapper: { [key: string]: string } = {
        'CREATED': 'Creado',
        'INVITED': 'Invitación enviada',
        'IN_PROGRESS': 'Pendiente de completar Documentación',
        'COMPLETED': 'Finalizado con contrato',
        'NO_CONTRACT_SENDED': 'Gestionado sin contrato',
        'CONTRACT_SENDED': 'Gestionado con contrato sin firmar'
  };

  creditStatuses: CreditStatus[] = ['PENDING', 'ACTIVE', 'CLOSED', 'COMPLETED', 'DEFAULTED', 'CANCELLED'];
  paymentTypes: { value: PaymentType; label: string }[] = [
    { value: 'WEEKLY', label: 'Semanal' },
    { value: 'DAILY', label: 'Diaria' }
  ];

  statusMapper: { [key: string]: string } = {
    'CREATED': 'Cliente capturado',
    'INVITED': 'Invitado / Link enviado',
    'IN_PROGRESS': 'En progreso',
    'COMPLETED': 'Venta realizada',
    'NO_CONTRACT_SENDED': 'Pendiente contrato',
    'CONTRACT_SENDED': 'Contrato enviado'
  };

  pipelineColors: { [key: string]: string } = {
    'CREATED': '#3b82f6',
    'INVITED': '#8b5cf6',
    'IN_PROGRESS': '#f59e0b',
    'NO_CONTRACT_SENDED': '#f97316',
    'CONTRACT_SENDED': '#6b7280',
    'COMPLETED': '#4CAF50'
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
  user: User | null = null;

  // Date shortcuts
  dateShortcuts = [
    { label: 'Hoy', days: 0 },
    { label: 'Últ. 7 días', days: 6 },
    { label: 'Este mes', type: 'month' },
    { label: 'Mes ant.', type: 'prev-month' }
  ];

  constructor(
    private _statisticsService: StatisticsService,
    private _changeDetectorRef: ChangeDetectorRef,
    private _snackBar: MatSnackBar,
    private _storesService: StoresService,
    private _userService: UserService,
    private _permissionService: PermissionService
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

    this.trendChartOptions = {
      series: [],
      chart: {
        type: 'line',
        height: 300,
        fontFamily: 'Inter, sans-serif',
        toolbar: { show: false },
        zoom: { enabled: false }
      },
      stroke: { curve: 'smooth', width: 2 },
      colors: ['#66a8ee', '#4CAF50'],
      xaxis: { categories: [] },
      yaxis: {
        labels: {
          formatter: (val: number) => this.formatCurrency(val)
        }
      },
      legend: { position: 'top' },
      grid: { borderColor: '#e5e7eb', strokeDashArray: 4 },
      tooltip: {
        shared: true,
        intersect: false,
        y: { formatter: (val: number) => this.formatCurrency(val) }
      },
      dataLabels: { enabled: false }
    };

    this.commercialStoreChartOptions = {
      series: [],
      chart: {
        type: 'bar',
        height: 300,
        fontFamily: 'Inter, sans-serif',
        toolbar: { show: false }
      },
      plotOptions: {
        bar: { horizontal: true, borderRadius: 4, distributed: true }
      },
      colors: ['#66a8ee'],
      dataLabels: { enabled: false },
      xaxis: { categories: [] },
      legend: { show: false },
      grid: { borderColor: '#e5e7eb', strokeDashArray: 4 },
      tooltip: {
        y: { formatter: (val: number) => `${val} créditos` }
      }
    };

    this.commercialAgentChartOptions = {
      series: [],
      chart: {
        type: 'bar',
        height: 300,
        fontFamily: 'Inter, sans-serif',
        toolbar: { show: false }
      },
      plotOptions: {
        bar: { horizontal: true, borderRadius: 4, distributed: true }
      },
      colors: ['#66a8ee'],
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `${val.toFixed(1)}%`,
        offsetX: 30,
        style: { fontSize: '12px', colors: ['#374151'] }
      },
      xaxis: { categories: [], max: 100 },
      legend: { show: false },
      grid: { borderColor: '#e5e7eb', strokeDashArray: 4 },
      tooltip: {
        y: { formatter: (val: number) => `${val.toFixed(1)}%` }
      }
    };

    this.collectionChartOptions = {
      series: [],
      chart: {
        type: 'bar',
        height: 300,
        fontFamily: 'Inter, sans-serif',
        toolbar: { show: false }
      },
      plotOptions: {
        bar: { horizontal: false, borderRadius: 4, columnWidth: '55%' }
      },
      colors: ['#E0E0E0', '#66a8ee'],
      dataLabels: { enabled: false },
      xaxis: { categories: [] },
      legend: { position: 'top' },
      grid: { borderColor: '#e5e7eb', strokeDashArray: 4 },
      tooltip: {
        shared: true,
        intersect: false,
        y: { formatter: (val: number) => this.formatCurrency(val) }
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
    this._userService.user$
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe((user) => {
            this.user = user;
        });

    this.filterForm = new FormGroup({
      storeId: new FormControl(null),
      agentId: new FormControl(null),
      startDate: new FormControl(null),
      endDate: new FormControl(null),
      clientStatus: new FormControl(null),
      creditStatus: new FormControl(null),
      paymentType: new FormControl(null)
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

  hasPermission(permission: string): boolean {
    if (!this.user || !this.user.permissions) {
        return false;
    }
    return this.user.permissions.includes(permission) || this.user.rol === 'admin';
  }

  loadAllSections(): void {
    const baseFilters = this.buildBaseFilters();

    if (this._permissionService.hasPermission('stats:read:all:get:stats.clients')) {
        this.loadClientStats(baseFilters);
    }

    if (this._permissionService.hasPermission('stats:read:all:get:stats.credits')) {
        this.loadCreditStats(baseFilters);
    }

    if (this._permissionService.hasPermission('stats:read:store:get:stats.stores')) {
        this.loadStoreStats(baseFilters);
    }

    if (this._permissionService.hasPermission('stats:read:all:get:stats.dashboard')) {
        this.loadDashboardStats(baseFilters);
    }

    if (this._permissionService.hasPermission('stats:read:all:get:stats.agents.credits')) {
        this.loadAgentCredits(baseFilters);
    }

    if (this._permissionService.hasPermission('stats:read:all:get:stats.agents.performance')) {
        this.loadAgentPerformance(baseFilters);
    }

    // New endpoints
    this.loadSummaryStats(baseFilters);
    this.loadTrendStats(baseFilters);
    this.loadCommercialStats(baseFilters);
    this.loadPortfolioStats(baseFilters);
    this.loadCollectionStats(baseFilters);
    this.loadAlertsStats(baseFilters);
  }

  private buildBaseFilters() {
    const filters = this.filterForm.value;
    return {
      storeId: filters.storeId || undefined,
      agentId: filters.agentId || undefined,
      clientStatus: filters.clientStatus || undefined,
      creditStatus: filters.creditStatus || undefined,
      paymentType: filters.paymentType || undefined,
      startDate: filters.startDate ? (filters.startDate instanceof Date ? filters.startDate.toISOString() : new Date(filters.startDate).toISOString()) : undefined,
      endDate: filters.endDate ? (filters.endDate instanceof Date ? filters.endDate.toISOString() : new Date(filters.endDate).toISOString()) : undefined
    };
  }

  applyDateShortcut(shortcut: any): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let start: Date;
    let end: Date = new Date(today);
    end.setHours(23, 59, 59, 999);

    if (shortcut.type === 'month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (shortcut.type === 'prev-month') {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
      end.setHours(23, 59, 59, 999);
    } else {
      start = new Date(today);
      start.setDate(today.getDate() - shortcut.days);
    }

    this.filterForm.patchValue({ startDate: start, endDate: end });
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

  private loadSummaryStats(baseFilters: any): void {
    this._statisticsService.getSummaryStatistics({
      storeId: baseFilters.storeId,
      agentId: baseFilters.agentId,
      paymentType: baseFilters.paymentType,
      creditStatus: baseFilters.creditStatus
    }).pipe(takeUntil(this._unsubscribeAll)).subscribe({
      next: (res) => { this.summaryStats = res; this._changeDetectorRef.markForCheck(); },
      error: () => {} // silently fail if endpoint not yet implemented
    });
  }

  private loadTrendStats(baseFilters: any): void {
    this._statisticsService.getTrendStatistics({
      storeId: baseFilters.storeId,
      agentId: baseFilters.agentId
    }).pipe(takeUntil(this._unsubscribeAll)).subscribe({
      next: (res) => {
        this.trendStats = res;
        this.updateTrendChart(res);
        this._changeDetectorRef.markForCheck();
      },
      error: () => {}
    });
  }

  private loadCommercialStats(baseFilters: any): void {
    this._statisticsService.getCommercialStatistics({
      storeId: baseFilters.storeId,
      agentId: baseFilters.agentId,
      startDate: baseFilters.startDate,
      endDate: baseFilters.endDate
    }).pipe(takeUntil(this._unsubscribeAll)).subscribe({
      next: (res) => {
        this.commercialStats = res;
        this.updateCommercialCharts(res);
        this._changeDetectorRef.markForCheck();
      },
      error: () => {}
    });
  }

  private loadPortfolioStats(baseFilters: any): void {
    this._statisticsService.getPortfolioStatistics({
      storeId: baseFilters.storeId,
      agentId: baseFilters.agentId
    }).pipe(takeUntil(this._unsubscribeAll)).subscribe({
      next: (res) => { this.portfolioStats = res; this._changeDetectorRef.markForCheck(); },
      error: () => {}
    });
  }

  private loadCollectionStats(baseFilters: any): void {
    this._statisticsService.getCollectionStatistics({
      storeId: baseFilters.storeId,
      agentId: baseFilters.agentId
    }).pipe(takeUntil(this._unsubscribeAll)).subscribe({
      next: (res) => {
        this.collectionStats = res;
        this.updateCollectionChart(res);
        this._changeDetectorRef.markForCheck();
      },
      error: () => {}
    });
  }

  private loadAlertsStats(baseFilters: any): void {
    this._statisticsService.getAlertsStatistics({
      storeId: baseFilters.storeId,
      agentId: baseFilters.agentId
    }).pipe(takeUntil(this._unsubscribeAll)).subscribe({
      next: (res) => { this.alertsStats = res; this._changeDetectorRef.markForCheck(); },
      error: () => {}
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

  private updateTrendChart(data: TrendStatsResponse): void {
    if (!data?.days?.length) return;
    this.trendChartOptions = {
      ...this.trendChartOptions,
      series: [
        { name: 'Ventas', data: data.days.map(d => d.sales.amount) },
        { name: 'Recaudo', data: data.days.map(d => d.collection.amount) }
      ],
      xaxis: { categories: data.days.map(d => d.dayName) }
    };
  }

  private updateCommercialCharts(data: CommercialStatsResponse): void {
    if (data?.salesByStore?.length) {
      const sorted = [...data.salesByStore].sort((a, b) => b.creditCount - a.creditCount);
      this.commercialStoreChartOptions = {
        ...this.commercialStoreChartOptions,
        series: [{ name: 'Créditos', data: sorted.map(s => s.creditCount) }],
        xaxis: { categories: sorted.map(s => s.storeName) }
      };
    }
    if (data?.salesByAgent?.length) {
      const sorted = [...data.salesByAgent].sort((a, b) => b.approvalRate - a.approvalRate);
      this.commercialAgentChartOptions = {
        ...this.commercialAgentChartOptions,
        series: [{ name: '% Aprobación', data: sorted.map(a => +a.approvalRate.toFixed(1)) }],
        xaxis: { categories: sorted.map(a => a.agentName), max: 100 }
      };
    }
  }

  private updateCollectionChart(data: CollectionStatsResponse): void {
    if (!data?.days?.length) return;
    this.collectionChartOptions = {
      ...this.collectionChartOptions,
      series: [
        { name: 'Esperado', data: data.days.map(d => d.expected) },
        { name: 'Real', data: data.days.map(d => d.actual) }
      ],
      xaxis: { categories: data.days.map(d => d.dayName) }
    };
  }

  updateClientChart(data: any): void {
    if (data && data.statuses) {
      this.clientChartOptions.series = data.statuses.map((s: any) => s.count);
      this.clientChartOptions.labels = data.statuses.map((s: any) => this.statusMapper[s.status] || s.status);
      this.clientChartOptions.colors = data.statuses.map((s: any) => this.pipelineColors[s.status] || '#6b7280');
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

  formatDelta(delta: number | null | undefined): string {
    if (delta === null || delta === undefined) return '';
    const sign = delta >= 0 ? '+' : '';
    return `${sign}${delta.toFixed(1)}%`;
  }

  isDeltaPositive(delta: number | null | undefined): boolean {
    return delta !== null && delta !== undefined && delta > 0;
  }

  isDeltaNegative(delta: number | null | undefined): boolean {
    return delta !== null && delta !== undefined && delta < 0;
  }

  hasDelta(delta: number | null | undefined): boolean {
    return delta !== null && delta !== undefined;
  }

  getPipelineAlertClass(entry: ClientStatusEntry): string {
    if (entry.status === 'NO_CONTRACT_SENDED' && entry.percentOfTotal > 20) return 'text-orange-600 font-semibold';
    if (entry.status === 'CREATED' && entry.avgDaysInStatus > 3) return 'text-red-600 font-semibold';
    return '';
  }

  getAlertSeverityIcon(severity: string): string {
    return severity === 'critical' ? 'error' : severity === 'warning' ? 'warning' : 'info';
  }

  getAlertSeverityClass(severity: string): string {
    if (severity === 'critical') return 'text-red-500 bg-red-50 border-red-200';
    if (severity === 'warning') return 'text-amber-500 bg-amber-50 border-amber-200';
    return 'text-blue-500 bg-blue-50 border-blue-200';
  }

  getAlertIconClass(severity: string): string {
    if (severity === 'critical') return 'text-red-500';
    if (severity === 'warning') return 'text-amber-500';
    return 'text-blue-500';
  }

  getAlertDetailLink(alert: AlertItem): string[] | null {
    const d = alert.details;
    if (d['storeId']) return ['/stores', d['storeId']];
    if (d['clientId']) return ['/clients', d['clientId']];
    if (d['agentId']) return ['/agents', d['agentId']];
    return null;
  }

  toggleAlerts(): void {
    this.alertsOpen = !this.alertsOpen;
  }

  togglePerformance(): void {
    this.performanceOpen = !this.performanceOpen;
  }

  toggleStores(): void {
    this.storesOpen = !this.storesOpen;
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
