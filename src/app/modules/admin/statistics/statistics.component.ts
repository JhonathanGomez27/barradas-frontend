import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { FuseCardComponent } from '@fuse/components/card';
import { ApexAxisChartSeries, ApexChart, ApexDataLabels, ApexFill, ApexGrid, ApexLegend, ApexNonAxisChartSeries, ApexPlotOptions, ApexResponsive, ApexStroke, ApexTitleSubtitle, ApexTooltip, ApexXAxis, ApexYAxis, ChartComponent, NgApexchartsModule } from 'ng-apexcharts';
import { ReplaySubject, Subject, takeUntil } from 'rxjs';
import { StatisticsService } from './statistics.service';
import { ClientStatus, CreditStatus } from './statistics.types';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { Store, StoresService } from '../stores/stores.service';

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
    NgApexchartsModule,
    FuseCardComponent,
    ScrollingModule
  ],
  templateUrl: './statistics.component.html'
})
export class StatisticsComponent implements OnInit {
  @ViewChild('chart') chart: ChartComponent;

  clientStats: any;
  creditStats: any;
  storeStats: any;

  clientChartOptions: Partial<ChartOptions>;
  creditChartOptions: Partial<ChartOptions>;

  filterForm: FormGroup;
  clientStatuses: ClientStatus[] = ['CREATED', 'INVITED', 'IN_PROGRESS', 'NO_CONTRACT_SENDED', 'CONTRACT_SENDED', 'COMPLETED'];
  creditStatuses: CreditStatus[] = ['PENDING', 'ACTIVE', 'CLOSED', 'DEFAULTED', 'CANCELLED'];

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
  }

  ngOnInit(): void {
    this.filterForm = new FormGroup({
      storeId: new FormControl(null),
      startDate: new FormControl(null),
      endDate: new FormControl(null),
      clientStatus: new FormControl(null),
      creditStatus: new FormControl(null)
    });

    this.loadData();

    this.filterForm.valueChanges
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(() => {
        this.loadData();
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

  loadData(): void {
    const filters = this.filterForm.value;
    const params = {
      ...filters,
      startDate: filters.startDate ? filters.startDate.toISOString() : null,
      endDate: filters.endDate ? filters.endDate.toISOString() : null
    };

    this._statisticsService.getClientsStatistics(params).subscribe({
      next: (res) => {
        this.clientStats = res;
        this.updateClientChart(res);
        this._changeDetectorRef.markForCheck();
      },
      error: (err) => {
        console.error(err);
        this._snackBar.open('Error cargando estadísticas de clientes', 'Cerrar', { duration: 3000 });
      }
    });

    this._statisticsService.getCreditsStatistics(params).subscribe({
      next: (res) => {
        this.creditStats = res;
        this.updateCreditChart(res);
        this._changeDetectorRef.markForCheck();
      },
      error: (err) => {
        console.error(err);
        this._snackBar.open('Error cargando estadísticas de créditos', 'Cerrar', { duration: 3000 });
      }
    });

    this._statisticsService.getStoresStatistics(params).subscribe({
      next: (res) => {
        this.storeStats = res;
        this._changeDetectorRef.markForCheck();
      },
      error: (err) => {
        console.error(err);
        this._snackBar.open('Error cargando estadísticas de tiendas', 'Cerrar', { duration: 3000 });
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
