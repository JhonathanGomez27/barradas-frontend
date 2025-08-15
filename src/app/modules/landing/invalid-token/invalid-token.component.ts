import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-invalid-token',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './invalid-token.component.html',
  styleUrl: './invalid-token.component.scss'
})
export class InvalidTokenComponent {
  constructor(private _router: Router) {}

  /**
   * Redirige al usuario a la página principal
   */
  navigateToHome(): void {
    this._router.navigate(['/']);
  }

  /**
   * Redirige al usuario a la página de contacto o soporte
   */
  navigateToContact(): void {
    this._router.navigate(['/contact']);
  }
}
