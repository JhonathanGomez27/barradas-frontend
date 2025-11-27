import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WebRtcService } from './web-rtc.service';
import { CommonModule } from '@angular/common';
import { Subscription, firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-web-rtc',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './web-rtc.component.html'
})
export class WebRtcComponent implements OnInit, OnDestroy {

  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  roomId: string = '';
  connectionState: string = 'disconnected';
  isAudioEnabled: boolean = true;
  isVideoEnabled: boolean = true;
  errorMessage: string = '';
  isLoading: boolean = false;
  hasJoined: boolean = false;
  isJoinReady: boolean = false;
  statusMessage: string = 'Listo para iniciar';
  manualRoomId: string = '';
  meetingLink: string = '';
  isCreatingRoom: boolean = false;

  private subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private webRtcService: WebRtcService,
    private snackBar: MatSnackBar
  ) { }

  async ngOnInit(): Promise<void> {
    this.errorMessage = '';
    this.isLoading = false;

    this.route.queryParams.subscribe(params => {
      const roomFromLink = (params['room'] || '').trim();

      if (roomFromLink) {
        this.roomId = roomFromLink;
        this.manualRoomId = roomFromLink;
        this.isJoinReady = true;
        this.webRtcService.notifyStatus(`Sala detectada desde el enlace: ${roomFromLink}`);
      }
    });

    // Subscribe to connection state changes
    this.subscriptions.add(
      this.webRtcService.connectionState$.subscribe(state => {
        this.connectionState = state;
      })
    );

    // Subscribe to remote stream
    this.subscriptions.add(
      this.webRtcService.remoteStream$.subscribe(stream => {
        if (stream && this.remoteVideo) {
          this.remoteVideo.nativeElement.srcObject = stream;
        }
      })
    );

    this.subscriptions.add(
      this.webRtcService.status$.subscribe(message => {
        this.statusMessage = message;
      })
    );
  }

  async createMeeting(): Promise<void> {
    if (this.isCreatingRoom) {
      return;
    }

    this.isCreatingRoom = true;
    try {
      const response = await firstValueFrom(this.webRtcService.createRoom());
      if (response) {
        this.meetingLink = response.url;
        this.manualRoomId = response.roomId;
        this.roomId = response.roomId;
        this.isJoinReady = true;
        this.hasJoined = false;
        this.webRtcService.notifyStatus('Sala creada. Comparte el enlace para invitar.');
      }
    } catch (error) {
      console.error('Error creating room', error);
      this.snackBar.open('No se pudo crear la sala, intenta nuevamente.', 'Cerrar', { duration: 4000 });
    } finally {
      this.isCreatingRoom = false;
    }
  }

  prepareJoinFromInput(): void {
    if (!this.manualRoomId) {
      this.snackBar.open('Ingresa un ID de sala válido.', 'Cerrar', { duration: 3000 });
      return;
    }

    this.roomId = this.manualRoomId.trim();
    this.hasJoined = false;
    this.isJoinReady = !!this.roomId;
    this.webRtcService.notifyStatus(`Sala seleccionada: ${this.roomId}`);
  }

  async copyMeetingLink(): Promise<void> {
    if (!this.meetingLink) {
      return;
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(this.meetingLink);
      } else {
        const tempInput = document.createElement('input');
        tempInput.value = this.meetingLink;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
      }
      this.snackBar.open('Enlace copiado al portapapeles', undefined, { duration: 2000 });
    } catch (error) {
      console.error('Error copying link', error);
      this.snackBar.open('No se pudo copiar el enlace', 'Cerrar', { duration: 3000 });
    }
  }

  openMeetingLink(): void {
    if (this.meetingLink) {
      window.open(this.meetingLink, '_blank');
    }
  }

  async joinCall(): Promise<void> {
    if (!this.roomId) {
      this.snackBar.open('Selecciona o crea una sala antes de unirte.', 'Cerrar', { duration: 3000 });
      return;
    }

    if (this.hasJoined) {
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    try {
      await this.initializeCall();
      this.hasJoined = true;
      this.webRtcService.notifyStatus('Intentando conectar con el otro participante...');
    } catch (error: any) {
      console.error('Error joining call:', error);
      this.handleMediaError(error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Initialize the video call
   */
  private async initializeCall(): Promise<void> {
    // Initialize socket connection
    this.webRtcService.initializeSocket();

    // Get local media stream
    const localStream = await this.webRtcService.getLocalStream();

    // Wait for view to be ready
    setTimeout(() => {
      if (this.localVideo) {
        this.localVideo.nativeElement.srcObject = localStream;
      }
    }, 100);

    // Join the room
    this.webRtcService.joinRoom(this.roomId);
  }

  /**
   * Toggle microphone on/off
   */
  toggleAudio(): void {
    this.isAudioEnabled = this.webRtcService.toggleAudio();
  }

  /**
   * Toggle camera on/off
   */
  toggleVideo(): void {
    this.isVideoEnabled = this.webRtcService.toggleVideo();
  }

  private handleMediaError(error: any): void {
    if (!error) {
      this.errorMessage = 'Error desconocido al iniciar la llamada.';
      return;
    }

    if (error.name === 'NotAllowedError') {
      this.errorMessage = 'Permiso denegado. Por favor, permite el acceso a la cámara y el micrófono.';
    } else if (error.name === 'NotFoundError') {
      this.errorMessage = 'No se encontró cámara o micrófono. Por favor, conecta un dispositivo.';
    } else {
      this.errorMessage = 'Error al inicializar la llamada. Por favor, intenta de nuevo.';
    }
  }

  /**
   * End the call and navigate away
   */
  endCall(): void {
    this.webRtcService.endCall();
    this.hasJoined = false;
    this.isJoinReady = !!this.roomId;
    this.router.navigate(['/']);
  }

  /**
   * Get connection status display text
   */
  getConnectionStatusText(): string {
    switch (this.connectionState) {
      case 'connected':
        return 'Conectado al servidor';
      case 'peer-joined':
        return 'Conectando con el otro usuario...';
      case 'connected-peer':
        return 'Llamada en curso';
      case 'disconnected':
        return 'Desconectado';
      default:
        return this.connectionState;
    }
  }

  /**
   * Get connection status color
   */
  getConnectionStatusColor(): string {
    switch (this.connectionState) {
      case 'connected-peer':
        return 'primary';
      case 'connected':
      case 'peer-joined':
        return 'accent';
      default:
        return 'warn';
    }
  }

  ngOnDestroy(): void {
    // Clean up on component destroy
    this.webRtcService.disconnect();
    this.subscriptions.unsubscribe();
  }
}
