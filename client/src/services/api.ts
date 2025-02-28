import type { Card } from '../types';

const BASE_URL = process.env.API_URL || 'http://localhost:3001';

class ApiService {
  private guestId: string | null = null;

  setGuestId(id: string | null) {
    this.guestId = id;
  }

  async getGuestId(): Promise<string> {
    const response = await fetch(`${BASE_URL}/guest`, {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include',
    });

    const result = await this.handleResponse<{ guestId: string }>(response);
    return result.guestId;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.guestId) {
      headers['X-Guest-Id'] = this.guestId;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Network response was not ok');
    }

    const newGuestId = response.headers.get('X-Guest-Id');
    if (newGuestId && newGuestId !== this.guestId) {
      this.guestId = newGuestId;
      window.dispatchEvent(new CustomEvent('guestIdUpdated', { detail: newGuestId }));
    }

    return response.json();
  }

  async drawCards(tableId: string): Promise<Card[]> {
    const response = await fetch(`${BASE_URL}/${tableId}/draw`, {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include',
    });

    console.log('drawCards response:', response);
    return this.handleResponse<Card[]>(response);
  }

  async performAction(tableId: string, action: string, value: any): Promise<any> {
    const response = await fetch(`${BASE_URL}/${tableId}/action`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ action, value }),
    });

    return this.handleResponse(response);
  }

  async joinGame(tableId: string): Promise<void> {
    // TODO: Implement WebSocket functionality
    console.log('Joining game:', tableId);
  }

  async leaveGame(tableId: string): Promise<void> {
    // TODO: Implement WebSocket functionality
    console.log('Leaving game:', tableId);
  }
}

export const api = new ApiService();
export default api;
