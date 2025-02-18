import type { Card } from '../game/types';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

class ApiService {
  private guestId: string | null = null;

  setGuestId(id: string | null) {
    this.guestId = id;
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

    // Check for guest ID in response headers
    const newGuestId = response.headers.get('X-Guest-Id');
    if (newGuestId && newGuestId !== this.guestId) {
      // Update the guest ID if it's different
      this.guestId = newGuestId;
      // Notify any listeners about the new guest ID
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

  // WebSocket event handling (placeholder for future implementation)
  async joinGame(tableId: string): Promise<void> {
    // Will be implemented when WebSocket functionality is added
    console.log('Joining game:', tableId);
  }

  async leaveGame(tableId: string): Promise<void> {
    // Will be implemented when WebSocket functionality is added
    console.log('Leaving game:', tableId);
  }
}

export const api = new ApiService();
export default api;
