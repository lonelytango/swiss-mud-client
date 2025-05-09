import type { MudProfile } from '../components/ConnectView';

export interface WebSocketManagerOptions {
	onOpen: () => void;
	onClose: () => void;
	onError: () => void;
	onMessage: (data: string) => void;
	onConnected: () => void;
}

export class WebSocketManager {
	private ws: WebSocket | null = null;
	private options: WebSocketManagerOptions;
	private closedByUser = false;
	private reconnectTimeout: NodeJS.Timeout | null = null;
	private currentProfile: MudProfile | null = null;

	constructor(options: WebSocketManagerOptions) {
		this.options = options;
	}

	public connect(profile: MudProfile): void {
		if (this.ws) {
			this.ws.close();
		}

		this.currentProfile = profile;
		// const url = import.meta.env.VITE_WS_URL || 'ws://localhost:4000';
		// console.log(import.meta.env.VITE_WS_URL);
		const url = 'wss://swiss-mud-proxy.fly.dev';
		this.ws = new WebSocket(url);
		this.setupEventHandlers();
	}

	public disconnect(): void {
		this.closedByUser = true;
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = null;
		}
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
	}

	public send(data: string): void {
		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			this.ws.send(data);
		}
	}

	public isConnected(): boolean {
		return this.ws?.readyState === WebSocket.OPEN;
	}

	private setupEventHandlers(): void {
		if (!this.ws) return;

		this.ws.onopen = () => {
			this.options.onOpen();
			// Send profile as first message
			if (this.currentProfile) {
				this.ws?.send(
					JSON.stringify({
						address: this.currentProfile.address,
						port: this.currentProfile.port,
					})
				);
			}
		};

		this.ws.onclose = () => {
			this.options.onClose();
			if (!this.closedByUser && this.currentProfile) {
				this.reconnectTimeout = setTimeout(() => {
					this.connect(this.currentProfile!);
				}, 5000);
			}
		};

		this.ws.onerror = () => {
			this.options.onError();
		};

		this.ws.onmessage = (event) => {
			this.options.onMessage(event.data);
			if (
				typeof event.data === 'string' &&
				event.data.includes('[INFO] Connected to MUD server')
			) {
				this.options.onConnected();
			}
		};
	}
}
