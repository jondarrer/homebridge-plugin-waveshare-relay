import { HomebridgePluginUiServer, RequestError } from '@homebridge/plugin-ui-utils';

import { WaveshareRelayApi } from '../services/waveshare-relay-api';

class WaveshareRelayPluginUiServer extends HomebridgePluginUiServer {
  constructor() {
    // super() MUST be called first
    super();

    // Handle request for the /server-details route
    this.onRequest('/server-details', this.getServerDetails.bind(this));

    // This MUST be called when you are ready to accept requests
    this.ready();
  }

  async getServerDetails({ urls }: { urls: string[] }): Promise<object[]> {
    const results = [];
    try {
      // Get relay details from each server
      for await (let url of urls) {
        const api = new WaveshareRelayApi(url);
        const relays = await api.getRelays(console);
        results.push({ url, relays });
      }

      return results;
    } catch (e) {
      console.error(e);
      throw new RequestError('Failed to get urls', this.getErrorMessage(e));
    }
  }

  getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}

export { WaveshareRelayPluginUiServer };
