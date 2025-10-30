import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { DocusealBuilderComponent } from '@docuseal/angular'
import { Subject, takeUntil } from 'rxjs';
import { DocusealService } from '../docuseal.service';

@Component({
  selector: 'app-sign-builder',
  imports: [
    DocusealBuilderComponent
  ],
  templateUrl: './sign-builder.component.html',
  styleUrl: './sign-builder.component.scss'
})
export class SignBuilderComponent implements OnInit, OnDestroy {

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    signatureData: any = null;

    token: string = '';
    fieldTypes: string[] = [
        'signature'
    ]

    submitters: any[] = [
        {
            email: 'email@example.com',
            role: 'Cliente',
            name: 'Nombre Cliente',
            phone: '555-1234'
        }
    ]

    constructor(
        private _docusealService: DocusealService,
        private _changeDetectorRef: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this._docusealService.signatureBuilder$.pipe(takeUntil(this._unsubscribeAll)).subscribe((response: any) => {
            this.signatureData = response;
            this.token = response.token;
            this._changeDetectorRef.markForCheck();
        });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
