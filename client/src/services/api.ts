import { CardValue, DrawResponse } from 'types/game';

const BASE_URL = typeof window !== 'undefined' 
  ? 'http://localhost:3001'  // Browser environment
  : process.env.API_URL || 'http://server:3001'; // Docker environment

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

  async drawCards(tableId: string): Promise<CardValue[]> {
    console.log('Drawing cards for table:', tableId);
    const response = await fetch(`${BASE_URL}/${tableId}/draw`, {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include',
    });

    console.log('drawCards response:', response);
    const data = await this.handleResponse<DrawResponse>(response);
    console.log('drawCards data:', data);
    return data.data.cards;
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
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1000);
    }
  );
  }

  async leaveGame(tableId: string): Promise<void> {
    console.log('Leaving game:', tableId);
  }
}

export const api = new ApiService();
export default api;
