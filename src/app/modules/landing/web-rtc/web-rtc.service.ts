import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environment/environment';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebRtcService {

  private socketUrl: string = environment.socketUrl;

  private socket?: Socket;
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;

  // Observable streams for reactive UI updates
  private remoteStreamSubject = new BehaviorSubject<MediaStream | null>(null);
  public remoteStream$: Observable<MediaStream | null> = this.remoteStreamSubject.asObservable();

  private connectionStateSubject = new BehaviorSubject<string>('disconnected');
  public connectionState$: Observable<string> = this.connectionStateSubject.asObservable();

  private currentRoomId: string = '';
  private remotePeerId: string = '';
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private iceRestartAttempts = 0;
  private readonly maxIceRestartAttempts = 3;

  // ICE servers configuration
  private iceServers: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  private statusSubject = new BehaviorSubject<string>('Listo para iniciar');
  public status$: Observable<string> = this.statusSubject.asObservable();

  constructor(private http: HttpClient) { }

  private setStatus(message: string): void {
    this.statusSubject.next(message);
  }

  notifyStatus(message: string): void {
    this.setStatus(message);
  }

  createRoom(): Observable<{ roomId: string; url: string }> {
    return this.http.post<{ roomId: string; url: string }>(`${environment.url}/web-rtc/create-room`, {});
  }

  /**
   * Initialize Socket.IO connection
   */
  initializeSocket(): void {
    if (this.socket && this.socket.connected) {
      return;
    }

    if (this.socket) {
      this.socket.connect();
      return;
    }

    this.socket = io(this.socketUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    this.setupSocketListeners();
  }

  /**
   * Setup Socket.IO event listeners for signaling
   */
  private setupSocketListeners(): void {
    // Socket connection events
    this.socket?.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.connectionStateSubject.next('connected');
      this.setStatus('Conectado al servidor de señalización');

      if (this.currentRoomId) {
        this.socket?.emit('joinRoom', this.currentRoomId);
      }
    });

    this.socket?.on('reconnect', () => {
      console.log('Socket reconnected');
      this.setStatus('Reconectado. Reingresando a la sala...');
      if (this.currentRoomId) {
        this.socket?.emit('joinRoom', this.currentRoomId);
      }
    });

    this.socket?.on('disconnect', () => {
      console.log('Socket disconnected');
      this.connectionStateSubject.next('disconnected');
      this.setStatus('Desconectado del servidor de señalización');
      this.scheduleIceRestart();
    });

    this.socket?.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.connectionStateSubject.next('disconnected');
      this.setStatus('Error de conexión. Reintentando...');
    });

    // Peer joined - create offer
    this.socket?.on('peerJoined', async (data: { peerId: string }) => {
      console.log('Peer joined:', data.peerId);
      this.remotePeerId = data.peerId;
      this.connectionStateSubject.next('peer-joined');
      this.setStatus(`Usuario ${data.peerId} se unió. Creando oferta...`);

      if (!this.peerConnection) {
        this.createPeerConnection();
      }

      await this.sendOffer();
    });

    // Receive offer - create answer
    this.socket?.on('offer', async (data: { offer: RTCSessionDescriptionInit; senderId: string }) => {
      console.log('Offer received from:', data.senderId);
      this.remotePeerId = data.senderId;
      this.connectionStateSubject.next('peer-joined');
      this.setStatus('Oferta recibida. Preparando respuesta...');

      if (!this.peerConnection) {
        this.createPeerConnection();
      }

      const peerConnection = this.peerConnection!;
      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        this.socket?.emit('answer', {
          answer: answer,
          roomId: this.currentRoomId,
          targetPeerId: data.senderId
        });

        console.log('Answer sent to peer:', data.senderId);
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    });

    // Receive answer
    this.socket?.on('answer', async (data: { answer: RTCSessionDescriptionInit; senderId: string }) => {
      console.log('Answer received from:', data.senderId);
      this.setStatus('Respuesta recibida. Finalizando conexión...');

      try {
        await this.peerConnection?.setRemoteDescription(new RTCSessionDescription(data.answer));
        console.log('Answer processed successfully');
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    });

    // Receive ICE candidate
    this.socket?.on('iceCandidate', async (data: { candidate: RTCIceCandidateInit; senderId: string }) => {
      console.log('ICE candidate received from:', data.senderId);
      this.setStatus('Nuevo candidato ICE recibido');

      try {
        if (this.peerConnection) {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
          console.log('ICE candidate added');
        }
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    });

    this.socket?.on('peerLeft', () => {
      console.log('Peer left room');
      this.remotePeerId = '';
      this.connectionStateSubject.next('peer-left');
      this.setStatus('El otro participante abandonó la sala');
      this.cleanupPeerConnection();
      this.remoteStreamSubject.next(null);
    });

    this.socket?.on('roomError', (data: { message?: string }) => {
      const message = data?.message || 'No se pudo ingresar a la sala';
      this.setStatus(message);
      console.error('Room error:', message);
    });

    this.socket?.on('existingPeers', async (peers: string[]) => {
      if (!peers || peers.length === 0) {
        this.setStatus('Esperando a otro participante...');
        return;
      }

      this.remotePeerId = peers[0];
      this.setStatus(`Participante detectado (${this.remotePeerId}). Enviando oferta...`);
      if (!this.peerConnection) {
        this.createPeerConnection();
      }
      await this.sendOffer();
    });

    this.socket?.on('peerDisconnected', (data: { peerId: string }) => {
      console.log('Peer disconnected:', data.peerId);
      this.setStatus(`El participante ${data.peerId} se desconectó`);
      this.remotePeerId = '';
      this.cleanupPeerConnection();
      this.remoteStreamSubject.next(null);
    });
  }

  /**
   * Create peer connection
   */
  private createPeerConnection(): void {
    this.cleanupPeerConnection();
    this.peerConnection = new RTCPeerConnection(this.iceServers);

    const localStream = this.localStream;
    if (localStream) {
      localStream.getTracks().forEach(track => {
        this.peerConnection?.addTrack(track, localStream);
      });
    }

    this.peerConnection.ontrack = (event) => {
      console.log('Remote track received');
      const [remoteStream] = event.streams;
      this.remoteStreamSubject.next(remoteStream);
      this.connectionStateSubject.next('connected-peer');
      this.clearReconnectTimeout();
      this.setStatus('Audio y video conectados');
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.remotePeerId) {
        console.log('Sending ICE candidate');
        this.socket?.emit('iceCandidate', {
          candidate: event.candidate,
          roomId: this.currentRoomId,
          targetPeerId: this.remotePeerId
        });
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection) {
        console.log('Connection state:', this.peerConnection.connectionState);
        this.handlePeerConnectionStateChange(this.peerConnection.connectionState);
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      if (this.peerConnection) {
        console.log('ICE connection state:', this.peerConnection.iceConnectionState);
        if (this.peerConnection.iceConnectionState === 'failed') {
          this.restartIce();
        } else if (this.peerConnection.iceConnectionState === 'disconnected') {
          this.scheduleIceRestart();
        }
      }
    };

    this.peerConnection.onnegotiationneeded = async () => {
      if (this.peerConnection?.signalingState === 'stable') {
        await this.sendOffer();
      }
    };
  }

  private async sendOffer(options: RTCOfferOptions = {}): Promise<void> {
    if (!this.peerConnection || !this.currentRoomId || !this.socket) {
      return;
    }

    if (!this.remotePeerId && !options.iceRestart) {
      return;
    }

    try {
      const offer = await this.peerConnection.createOffer(options);
      await this.peerConnection.setLocalDescription(offer);

      this.socket.emit('offer', {
        offer,
        roomId: this.currentRoomId,
        targetPeerId: this.remotePeerId
      });

      const message = options.iceRestart ? 'Reinicio de ICE enviado' : 'Oferta enviada al participante';
      this.setStatus(message);
      console.log(message);
    } catch (error) {
      console.error('Error sending offer:', error);
      this.setStatus('No se pudo enviar la oferta');
    }
  }

  private handlePeerConnectionStateChange(state: RTCPeerConnectionState): void {
    switch (state) {
      case 'connected':
        this.connectionStateSubject.next('connected-peer');
        this.iceRestartAttempts = 0;
        this.clearReconnectTimeout();
        break;
      case 'failed':
        this.connectionStateSubject.next('failed');
        this.restartIce();
        break;
      case 'disconnected':
        this.connectionStateSubject.next('disconnected');
        this.scheduleIceRestart();
        break;
      case 'closed':
        this.connectionStateSubject.next('disconnected');
        this.cleanupPeerConnection();
        break;
      default:
        this.connectionStateSubject.next(state);
    }
  }

  private scheduleIceRestart(): void {
    if (this.reconnectTimeout) {
      return;
    }

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      if (this.peerConnection && this.peerConnection.connectionState !== 'connected') {
        this.restartIce();
      }
    }, 2000);
    this.setStatus('Intentando recuperar la conexión...');
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private async restartIce(): Promise<void> {
    if (!this.peerConnection || !this.remotePeerId || !this.socket) {
      return;
    }

    if (this.iceRestartAttempts >= this.maxIceRestartAttempts) {
      console.warn('Max ICE restart attempts reached');
      this.connectionStateSubject.next('disconnected');
      this.setStatus('No se pudo restablecer la conexión');
      return;
    }

    this.iceRestartAttempts++;
    const message = `Reintentando conexión (intento ${this.iceRestartAttempts})`;
    console.log(message);
    this.setStatus(message);
    await this.sendOffer({ iceRestart: true });
  }

  private cleanupPeerConnection(): void {
    if (this.peerConnection) {
      this.peerConnection.ontrack = null;
      this.peerConnection.onicecandidate = null;
      this.peerConnection.onconnectionstatechange = null;
      this.peerConnection.oniceconnectionstatechange = null;
      this.peerConnection.onnegotiationneeded = null;
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }

  /**
   * Get local media stream (camera and microphone)
   */
  async getLocalStream(constraints: MediaStreamConstraints = { video: true, audio: true }): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Got local stream');
      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  /**
   * Join a room
   */
  joinRoom(roomId: string): void {
    this.currentRoomId = roomId;
    if (!this.socket) {
      this.initializeSocket();
    }
    this.socket?.emit('joinRoom', roomId);
    this.setStatus(`Uniéndose a la sala ${roomId}...`);
    console.log('Joined room:', roomId);
  }

  /**
   * Toggle audio (mute/unmute)
   */
  toggleAudio(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }

  /**
   * Toggle video (camera on/off)
   */
  toggleVideo(): boolean {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }

  /**
   * Get local stream
   */
  getLocalMediaStream(): MediaStream | null {
    return this.localStream || null;
  }

  /**
   * End call and cleanup
   */
  endCall(): void {
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Close peer connection
    this.cleanupPeerConnection();
    this.clearReconnectTimeout();
    this.remotePeerId = '';
    this.iceRestartAttempts = 0;

    // Clear remote stream
    this.remoteStreamSubject.next(null);
    this.connectionStateSubject.next('disconnected');
    this.setStatus('Llamada finalizada');

    console.log('Call ended');
  }

  /**
   * Disconnect socket
   */
  disconnect(): void {
    this.endCall();

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = undefined;
    }
  }
}
