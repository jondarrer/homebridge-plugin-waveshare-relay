import { IPlatformAccessory, IService } from './homebridge-types';
import { IWaveshareRelay, WaveshareRelayApi } from './services/waveshare-relay-api';
import { WaveshareRelayHomebridgePlatform } from './waveshare-relay-homebridge-platform';

/**
 * Represents the air temperature sensor on the thermostat
 */
export class WaveshareRelayLightbulbAccessory {
  static TYPE = 'Relay';

  service: IService;
  waveshareRelayApi: WaveshareRelayApi;

  constructor(
    private platform: WaveshareRelayHomebridgePlatform,
    private accessory: IPlatformAccessory
  ) {
    this.platform.log.debug('Begin adding accessory', accessory);
    const context = this.accessory.context as IWaveshareRelay;
    const waveshareRelayApi = this.platform.waveshareRelayApis.find((api) => api.url === context.url);
    if (waveshareRelayApi === undefined) {
      throw new Error(`Unable to find waveshare relay api: ${context.url}`);
    }
    this.waveshareRelayApi = waveshareRelayApi;

    const { Manufacturer, Model, SerialNumber, Name, On } = this.platform.Characteristic;

    // Set accessory information
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)
      .setCharacteristic(Manufacturer, 'Waveshare')
      .setCharacteristic(Model, 'RPi Relay Board')
      .setCharacteristic(SerialNumber, WaveshareRelayApi.buildRelayGuid(context));

    // Get the Lightbulb service
    this.service = this.accessory.getService(this.platform.Service.Lightbulb);

    if (!this.service) {
      this.service = this.accessory.addService(this.platform.Service.Lightbulb);
    }

    // Set the service name, this is what is displayed as the default name on the Home app
    this.service.setCharacteristic(Name, context.name);

    // Each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb
    this.service
      .getCharacteristic(On)
      .onGet(this.getState.bind(this))
      .updateValue(context.state === 1);

    this.service.getCharacteristic(On).onSet(this.setState.bind(this));
  }

  /**
   *
   * @returns {Promise<import('homebridge').CharacteristicValue>}
   */
  async getState() {
    const cachedRelay = this.accessory.context as IWaveshareRelay;
    const relayGuid = WaveshareRelayApi.buildRelayGuid(cachedRelay);
    this.platform.log.debug(`[${relayGuid}] begin reading state`);

    const relay = await this.waveshareRelayApi.getRelay(cachedRelay.id, this.platform.log);
    this.accessory.context = relay;

    this.platform.log.debug(`[${relayGuid}] state read as`, relay.state);

    return relay.state === 1;
  }

  async setState(state: boolean): Promise<void> {
    const cachedRelay = this.accessory.context as IWaveshareRelay;
    const relayGuid = WaveshareRelayApi.buildRelayGuid(cachedRelay);
    this.platform.log.debug(`[${relayGuid}] begin setting state`);

    const relay = await this.waveshareRelayApi.setRelay(cachedRelay.id, state, this.platform.log);
    this.accessory.context = relay;

    this.platform.log.debug(`[${relayGuid}] state set as`, relay.state);
  }
}
