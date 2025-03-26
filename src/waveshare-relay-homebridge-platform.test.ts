import { describe, it, beforeEach, mock, afterEach } from 'node:test';
import assert from 'node:assert';

import nock from 'nock';
import type { API, Logger, PlatformAccessory, UnknownContext } from 'homebridge';

import { APIMock, createLoggingMock } from './mocks/index.js';
import { PLUGIN_NAME, PLATFORM_NAME } from './settings.js';
import { WaveshareRelayHomebridgePlatform } from './waveshare-relay-homebridge-platform.js';
import { IAPI, IPlatformAccessory } from './homebridge-types.js';

let log: Logger;
let config: any;
let api: API & IAPI & APIMock;

type MockFunction<T extends (...args: any[]) => unknown> = T & {
  mock: { calls: { arguments: Parameters<T> }[]; callCount: () => number; restore: () => void };
};

let mockRegisterPlatformAccessories: MockFunction<APIMock['registerPlatformAccessories']>;

beforeEach(() => {
  log = createLoggingMock();
  config = {
    name: PLUGIN_NAME,
    platform: PLATFORM_NAME,
    waveshareUrls: undefined,
  };
  api = new APIMock() as unknown as API & IAPI & APIMock;
  mockRegisterPlatformAccessories = mock.method(api, 'registerPlatformAccessories') as unknown as MockFunction<
    APIMock['registerPlatformAccessories']
  >;
});

afterEach(() => {
  mockRegisterPlatformAccessories.mock.restore();
  nock.cleanAll();
});

describe('WaveshareRelayHomebridgePlatform', () => {
  it('should initialise without throwing', () => {
    // Arrange, Act & Assert
    assert.doesNotThrow(() => new WaveshareRelayHomebridgePlatform(log, config, api));
  });

  it('should register new accessories', async () => {
    // Arrange
    const waveshareUrl = 'http://waveshare1';
    const waveshareRelay1 = { name: 'Mirror Light', id: `CH1`, pin: '26' };
    const waveshareRelays = [waveshareRelay1];
    config.waveshareUrls = [waveshareUrl];
    nock(waveshareUrl).get('/').reply(200, waveshareRelays);
    new WaveshareRelayHomebridgePlatform(log, config, api);

    // Act
    await api.emit('didFinishLaunching');

    // Assert
    assert.equal(mockRegisterPlatformAccessories.mock.callCount(), 1);

    // We have to split up the arguments for each call, as partialDeepStrictEqual
    // will fail when comparing a PlatformAccessory type object and a plain object,
    // as per https://nodejs.org/api/assert.html#comparison-details
    assert.deepEqual(mockRegisterPlatformAccessories.mock.calls[0].arguments[0], PLUGIN_NAME);
    assert.deepEqual(mockRegisterPlatformAccessories.mock.calls[0].arguments[1], PLATFORM_NAME);
    assert.partialDeepStrictEqual(mockRegisterPlatformAccessories.mock.calls[0].arguments[2][0], {
      context: waveshareRelay1,
    });
  });

  it('should restore existing accessories', async () => {
    // Arrange
    const waveshareUrl = 'http://waveshare1';
    const waveshareRelay1 = { name: 'Mirror Light', id: `CH1`, pin: '26' };
    const waveshareRelays = [waveshareRelay1];
    config.waveshareUrls = [waveshareUrl];
    nock(waveshareUrl).get('/').reply(200, waveshareRelays);
    const plugin = new WaveshareRelayHomebridgePlatform(log, config, api);

    const accessoryDetails = {
      UUID: `UUID:${waveshareUrl}#${waveshareRelay1.id}`,
      displayName: waveshareRelay1.name,
      context: { ...waveshareRelay1, url: waveshareUrl },
    };
    const accessory = {
      accessoryDetails,
      getService: mock.fn((service) => service),
    } as unknown as PlatformAccessory<UnknownContext> & IPlatformAccessory;
    plugin.configureAccessory(accessory);

    // Act
    await api.emit('didFinishLaunching');

    // Assert
    assert.equal(mockRegisterPlatformAccessories.mock.callCount(), 1);

    // We have to split up the arguments for each call, as partialDeepStrictEqual
    // will fail when comparing a PlatformAccessory type object and a plain object,
    // as per https://nodejs.org/api/assert.html#comparison-details
    assert.deepEqual(mockRegisterPlatformAccessories.mock.calls[0].arguments[0], PLUGIN_NAME);
    assert.deepEqual(mockRegisterPlatformAccessories.mock.calls[0].arguments[1], PLATFORM_NAME);
    assert.partialDeepStrictEqual(mockRegisterPlatformAccessories.mock.calls[0].arguments[2][0], {
      context: waveshareRelay1,
    });
  });

  it('should unregister unused accessories', async () => {
    // Arrange
    const waveshareUrl = 'http://waveshare1';
    const waveshareRelay1 = { name: 'Mirror Light', id: `CH1`, pin: '26' };
    const waveshareRelays: unknown[] = [];
    config.waveshareUrls = [];
    nock(waveshareUrl).get('/').reply(200, waveshareRelays);
    const plugin = new WaveshareRelayHomebridgePlatform(log, config, api);

    const accessoryDetails = {
      UUID: `UUID:${waveshareUrl}#${waveshareRelay1.id}`,
      displayName: 'BATHROOM_ACCESSORY',
      context: { ...waveshareRelay1, url: waveshareUrl },
    };
    const accessory = {
      accessoryDetails,
      getService: mock.fn((service) => service),
    } as unknown as PlatformAccessory<UnknownContext> & IPlatformAccessory;
    plugin.configureAccessory(accessory);

    // Act
    await api.emit('didFinishLaunching');

    // Assert
    assert.equal(mockRegisterPlatformAccessories.mock.callCount(), 0);
  });
});
