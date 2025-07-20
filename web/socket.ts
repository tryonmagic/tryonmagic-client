"use client";

type WebSocketStatus = "CONNECTING" | "OPEN" | "CLOSING" | "CLOSED";

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectTimeout = 1000; // Start with 1 second
  private maxReconnectDelay = 10000; // Maximum delay of 30 seconds
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private status: WebSocketStatus = "CLOSED";

  constructor(userId: string) {
    let apiUrl = process.env.NEXT_PUBLIC_API_URL;
    apiUrl = apiUrl?.replace("https://", "ws://");
    const wsUrl = apiUrl + "/ws/" + userId;
    if (!wsUrl) throw new Error("WebSocket URL not configured");
    this.url = wsUrl;
    this.connect();
  }

  private connect() {
    try {
      this.ws = new WebSocket(this.url);
      this.status = "CONNECTING";

      this.ws.onopen = () => {
        this.status = "OPEN";
        this.reconnectTimeout = 1000;
        console.log("WebSocket connected");
      };

      this.ws.onclose = () => {
        this.status = "CLOSED";
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      this.ws.onmessage = (event) => {
        try {
          console.log("typeof event.data", typeof event.data);
          console.log("WebSocket message received:", event.data);
          if (typeof event.data === "string" && !event.data.startsWith("{")) {
            console.log("Received string message:", event.data);
            return;
          }
          const { type, data } = JSON.parse(event.data);
          this.notifyListeners(type, data);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };
    } catch (error) {
      console.error("WebSocket connection error:", error);
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    setTimeout(() => {
      // Calculate next timeout with exponential backoff, but cap it at maxReconnectDelay
      this.reconnectTimeout = Math.min(
        this.reconnectTimeout * 2,
        this.maxReconnectDelay,
      );
      this.connect();
    }, this.reconnectTimeout);
  }

  public on<T>(type: string, callback: (data: T) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)?.add(callback);

    // Return cleanup function
    return () => {
      this.listeners.get(type)?.delete(callback);
    };
  }

  private notifyListeners(type: string, data: any) {
    this.listeners.get(type)?.forEach((callback) => callback(data));
  }

  public send(type: string, data: any) {
    if (this.ws && this.status === "OPEN") {
      this.ws.send(JSON.stringify({ type, data }));
    } else {
      console.warn("WebSocket is not connected");
    }
  }

  public getStatus() {
    return this.status;
  }

  public disconnect() {
    if (this.ws) {
      this.status = "CLOSING";
      this.ws.close();
    }
  }
}
