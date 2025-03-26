import { describe, it, beforeEach, mock, afterEach } from 'node:test';
import assert from 'node:assert';

import nock from 'nock';
import type { API, Characteristic, Logger, PlatformAccessory, UnknownContext } from 'homebridge';

import { APIMock, CharacteristicMock, createLoggingMock } from './mocks/index.js';
import { PLUGIN_NAME, PLATFORM_NAME } from './settings.js';
import { WaveshareRelayHomebridgePlatform } from './waveshare-relay-homebridge-platform.js';
import { WaveshareRelayLightbulbAccessory } from './waveshare-relay-lightbulb-accessory.js';
import { IAPI, IPlatformAccessory } from './homebridge-types.js';
import { IWaveshareRelay, WaveshareRelayApi } from './services/waveshare-relay-api.js';

let log: Logger;
let config: any;
let api: API & IAPI & APIMock;

type MockFunction<T extends (...args: any[]) => any> = T & {
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
  // platform = new WaveshareRelayHomebridgePlatform(log, config, api);
  mockRegisterPlatformAccessories = mock.method(api, 'registerPlatformAccessories') as unknown as MockFunction<
    APIMock['registerPlatformAccessories']
  >;
  // platform.waveshareRelayApis = [new WaveshareRelayApi(config.waveshareUrls[0])];
});

afterEach(() => {
  mockRegisterPlatformAccessories.mock.restore();
  nock.cleanAll();
});

it('should initialise without throwing', () => {
  // Arrange
  const waveshareUrl = 'http://waveshare1';
  const waveshareRelay1: IWaveshareRelay = { name: 'Mirror Light', id: `CH1`, pin: 26, state: 0, url: waveshareUrl };
  const waveshareRelays = [waveshareRelay1];
  config.waveshareUrls = [waveshareUrl];
  nock(waveshareUrl).get('/').reply(200, waveshareRelay1);
  nock(waveshareUrl).get(`/${waveshareRelay1.id}`).reply(200, waveshareRelays);
  const platform = new WaveshareRelayHomebridgePlatform(log, config, api);

  const accessoryDetails = {
    UUID: `UUID:${waveshareUrl}#${waveshareRelay1.id}`,
    displayName: waveshareRelay1.name,
    context: { ...waveshareRelay1, url: waveshareUrl },
  };
  const accessory = {
    ...accessoryDetails,
    getService: mock.fn((service) => service),
  } as unknown as PlatformAccessory<UnknownContext> & IPlatformAccessory;
  platform.configureAccessory(accessory);
  platform.waveshareRelayApis = [new WaveshareRelayApi(waveshareUrl)];

  // Act & Assert
  assert.doesNotThrow(() => new WaveshareRelayLightbulbAccessory(platform, accessory));
});

describe('On', () => {
  it('should set the initial current temperature', async () => {
    // Arrange
    const waveshareUrl = 'http://waveshare1';
    const waveshareRelay1: IWaveshareRelay = { name: 'Mirror Light', id: `CH1`, pin: 26, state: 0, url: waveshareUrl };
    const waveshareRelays = [waveshareRelay1];
    config.waveshareUrls = [waveshareUrl];
    nock(waveshareUrl).get('/').reply(200, waveshareRelay1);
    nock(waveshareUrl).get(`/${waveshareRelay1.id}`).reply(200, waveshareRelays);
    const platform = new WaveshareRelayHomebridgePlatform(log, config, api);

    const { On } = platform.Characteristic;
    const mockUpdateValue = mock.method(On as unknown as Characteristic, 'updateValue');

    const accessoryDetails = {
      UUID: `UUID:${waveshareUrl}#${waveshareRelay1.id}`,
      displayName: waveshareRelay1.name,
      context: { ...waveshareRelay1, url: waveshareUrl },
    };
    const accessory = {
      ...accessoryDetails,
      getService: mock.fn((service) => service),
    } as unknown as PlatformAccessory<UnknownContext> & IPlatformAccessory;
    platform.configureAccessory(accessory);
    platform.waveshareRelayApis = [new WaveshareRelayApi(waveshareUrl)];

    // Act
    new WaveshareRelayLightbulbAccessory(platform, accessory);

    // Assert
    assert.ok(mockUpdateValue.mock.callCount() > 0);
    assert.deepEqual(mockUpdateValue.mock.calls[0].arguments, [false]);
  });

  it('should get the current temperature', async () => {
    // Arrange
    const waveshareUrl = 'http://waveshare1';
    const waveshareRelay1: IWaveshareRelay = { name: 'Mirror Light', id: `CH1`, pin: 26, state: 0, url: waveshareUrl };
    const waveshareRelays = [waveshareRelay1];
    config.waveshareUrls = [waveshareUrl];
    nock(waveshareUrl).get('/').reply(200, waveshareRelay1);
    nock(waveshareUrl).get(`/${waveshareRelay1.id}`).reply(200, waveshareRelays);
    const platform = new WaveshareRelayHomebridgePlatform(log, config, api);

    const { On } = platform.Characteristic;
    mock.method(On as unknown as Characteristic, 'updateValue');

    const accessoryDetails = {
      UUID: `UUID:${waveshareUrl}#${waveshareRelay1.id}`,
      displayName: waveshareRelay1.name,
      context: { ...waveshareRelay1, url: waveshareUrl },
    };
    const accessory = {
      ...accessoryDetails,
      getService: mock.fn((service) => service),
    } as unknown as PlatformAccessory<UnknownContext> & IPlatformAccessory;
    platform.configureAccessory(accessory);
    platform.waveshareRelayApis = [new WaveshareRelayApi(waveshareUrl)];

    // Act
    const lightbulb = new WaveshareRelayLightbulbAccessory(platform, accessory);
    const result = await (lightbulb.service.getCharacteristic(On) as unknown as CharacteristicMock).emit('get');

    // Assert
    assert.equal(result, false);
  });
});
