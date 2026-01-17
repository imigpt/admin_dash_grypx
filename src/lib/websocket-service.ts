import SockJS from 'sockjs-client';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';

const WEBSOCKET_URL = 'http://localhost:8081/ws';

export class WebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private pendingSubscriptions: Map<string, (message: any) => void> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;

  connect(onConnected?: () => void, onError?: (error: any) => void): Promise<void> {
    // If already connected, resolve immediately
    if (this.client?.connected) {
      console.log('WebSocket already connected');
      if (onConnected) onConnected();
      return Promise.resolve();
    }

    // If already connecting, return the existing promise
    if (this.isConnecting && this.connectionPromise) {
      console.log('WebSocket connection in progress...');
      return this.connectionPromise;
    }

    this.isConnecting = true;

    this.connectionPromise = new Promise((resolve, reject) => {
      console.log('Creating new WebSocket connection to', WEBSOCKET_URL);
      
      this.client = new Client({
        webSocketFactory: () => {
          console.log('Creating SockJS instance...');
          return new SockJS(WEBSOCKET_URL) as any;
        },
        debug: (str) => {
          // Only log important messages
          if (str.includes('CONNECT') || str.includes('ERROR') || str.includes('SUBSCRIBE')) {
            console.log('STOMP:', str);
          }
        },
        reconnectDelay: this.reconnectDelay,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        onConnect: () => {
          console.log('✅ WebSocket Connected Successfully!');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          
          // Process any pending subscriptions
          this.processPendingSubscriptions();
          
          if (onConnected) onConnected();
          resolve();
        },
        onDisconnect: () => {
          console.log('WebSocket Disconnected');
          this.isConnecting = false;
        },
        onStompError: (frame) => {
          console.error('❌ STOMP Error:', frame.headers['message']);
          this.isConnecting = false;
          if (onError) onError(frame);
          reject(new Error(frame.headers['message']));
        },
        onWebSocketError: (error) => {
          console.error('❌ WebSocket Error:', error);
          this.isConnecting = false;
          if (onError) onError(error);
          reject(error);
        },
        onWebSocketClose: (event) => {
          console.log('WebSocket Closed:', event.reason || 'No reason provided');
          this.isConnecting = false;
        },
      });

      try {
        this.client.activate();
      } catch (error) {
        console.error('Failed to activate WebSocket client:', error);
        this.isConnecting = false;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  private processPendingSubscriptions() {
    console.log(`Processing ${this.pendingSubscriptions.size} pending subscriptions...`);
    this.pendingSubscriptions.forEach((callback, topic) => {
      this.doSubscribe(topic, callback);
    });
    this.pendingSubscriptions.clear();
  }

  private doSubscribe(topic: string, callback: (message: any) => void): StompSubscription | null {
    if (!this.client?.connected) {
      console.warn('Cannot subscribe - WebSocket not connected');
      return null;
    }

    // Check if already subscribed
    if (this.subscriptions.has(topic)) {
      console.log(`Already subscribed to ${topic}`);
      return this.subscriptions.get(topic)!;
    }

    const subscription = this.client.subscribe(topic, (message: IMessage) => {
      try {
        const data = JSON.parse(message.body);
        console.log(`📨 Received message on ${topic}:`, data.type);
        callback(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    this.subscriptions.set(topic, subscription);
    console.log(`✅ Subscribed to ${topic}`);
    return subscription;
  }

  disconnect() {
    if (this.client) {
      this.subscriptions.forEach((subscription) => subscription.unsubscribe());
      this.subscriptions.clear();
      this.pendingSubscriptions.clear();
      this.client.deactivate();
      this.client = null;
      this.connectionPromise = null;
      this.isConnecting = false;
    }
  }

  subscribeToMatch(matchId: number, callback: (message: any) => void): () => void {
    const topic = `/topic/match/${matchId}`;

    if (this.client?.connected) {
      // Already connected - subscribe immediately
      this.doSubscribe(topic, callback);
    } else {
      // Not connected - add to pending and connect
      console.log(`Adding pending subscription for ${topic}`);
      this.pendingSubscriptions.set(topic, callback);
      
      this.connect().catch((error) => {
        console.error('Failed to connect for subscription:', error);
      });
    }

    // Return unsubscribe function
    return () => {
      const subscription = this.subscriptions.get(topic);
      if (subscription) {
        subscription.unsubscribe();
        this.subscriptions.delete(topic);
        console.log(`Unsubscribed from ${topic}`);
      }
      this.pendingSubscriptions.delete(topic);
    };
  }

  isConnected(): boolean {
    return this.client?.connected || false;
  }
}

// Singleton instance
export const webSocketService = new WebSocketService();
