// HomebridgePluginUiServer uses setInterval to determine whether its still
// connected. We don't want any open handles after running our tests.
// See https://github.com/homebridge/plugin-ui-utils/blob/latest/src/server.ts#L190
// jest.useFakeTimers();

import { describe, it, afterEach, mock } from 'node:test';
import assert from 'node:assert';

import { IWaveshareRelay, WaveshareRelayApi } from '../services/waveshare-relay-api';
import { ILogger } from '../homebridge-types';

class MockedHomebridgePluginUiServer {
  handlers: Record<string, (...args: unknown[]) => unknown> = {};

  onRequest(path: string, fn: (...args: unknown[]) => unknown) {
    this.handlers[path] = fn;
  }

  ready() {}
}

class MockedRequestError extends Error {
  requestError;
  constructor(message: string, requestError: Error | unknown) {
    super(message);
    Object.setPrototypeOf(this, MockedRequestError.prototype);
    this.requestError = requestError;
  }
}

afterEach(async () => {
  // Restore the original implementation
  mock.reset();
});

describe('/server-details', () => {
  it('should return the server details for each server when given urls', async (t) => {
    // Arrange
    const waveshareUrl1 = 'http://waveshare1';
    const waveshareUrl2 = 'http://waveshare2';
    const waveshareUrls = [waveshareUrl1, waveshareUrl2];
    const waveshareRelay1: IWaveshareRelay = { name: 'Mirror Light', id: `CH1`, pin: 26, state: 0, url: waveshareUrl1 };
    const waveshareRelay2: IWaveshareRelay = {
      name: 'Mirror Demister',
      id: `CH2`,
      pin: 20,
      state: 0,
      url: waveshareUrl2,
    };
    const waveshareRelays = [
      { url: waveshareUrl1, relays: [waveshareRelay1] },
      { url: waveshareUrl2, relays: [waveshareRelay2] },
    ];
    t.mock.module('@homebridge/plugin-ui-utils', {
      namedExports: { HomebridgePluginUiServer: MockedHomebridgePluginUiServer, RequestError: MockedRequestError },
    });
    t.mock.method(
      WaveshareRelayApi.prototype,
      'getRelays',
      async (_log: ILogger) => Promise.resolve([waveshareRelay2]),
      {
        times: 1,
      }
    );
    t.mock.method(
      WaveshareRelayApi.prototype,
      'getRelays',
      async (_log: ILogger) => Promise.resolve([waveshareRelay1]),
      {
        times: 1,
      }
    );
    const { WaveshareRelayPluginUiServer } = await import('./waveshare-relay-plugin-ui-server.js');
    const server = new WaveshareRelayPluginUiServer();

    // Act
    // const response = await server.handlers['/server-details']({ urls: waveshareUrls });
    const response = await server.getServerDetails({ urls: waveshareUrls });
    t.mock.timers.enable({ apis: ['setInterval'] });
    t.mock.timers.tick(1);

    // Assert
    assert.deepEqual(response, waveshareRelays);
  });

  it('should throw an error when get relay request fails', async (t) => {
    // Arrange
    const waveshareUrl1 = 'http://waveshare1';
    const waveshareUrl2 = 'http://waveshare2';
    const waveshareUrls = [waveshareUrl1, waveshareUrl2];
    t.mock.module('@homebridge/plugin-ui-utils', {
      namedExports: { HomebridgePluginUiServer: MockedHomebridgePluginUiServer, RequestError: MockedRequestError },
    });
    t.mock.method(WaveshareRelayApi.prototype, 'getRelays', async (_log: ILogger) =>
      Promise.reject(new Error('An error occurred'))
    );
    const { WaveshareRelayPluginUiServer } = await import('./waveshare-relay-plugin-ui-server.js');
    const server = new WaveshareRelayPluginUiServer();
    t.mock.timers.enable({ apis: ['setInterval'] });
    t.mock.timers.tick(1);

    // Act & Assert
    await assert.rejects(
      async () => await server.getServerDetails({ urls: waveshareUrls }),
      new MockedRequestError('Failed to get urls', 'An error occurred')
    );
  });
});
