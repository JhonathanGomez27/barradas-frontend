import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AlertsService {

    Toast: any;

    constructor() {
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

    showAlertMessage(alert: {title: string, text: string, type: 'success' | 'error' | 'warning' | 'info'}) {
        this.Toast.fire({
            icon: alert.type || 'info',
            title: alert.title,
            text: alert.text
        });
    }
}
