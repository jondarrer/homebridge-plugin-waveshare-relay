import { IPlatformAccessory, IService } from "./homebridge-types";
import { IWaveshareRelay, TState } from "./services/waveshare-relay-api";
import { WaveshareRelayHomebridgePlatform } from "./waveshare-relay-homebridge-platform";

/**
 * Represents the air temperature sensor on the thermostat
 */
export class WaveshareRelayLightbulbAccessory {
  static TYPE = 'Relay';

  service: IService;

  /**
   *
   * @param {import('./warmup-homebridge-platform').WarmupHomebridgePlatform} platform
   * @param {import('homebridge').PlatformAccessory} accessory
   */
  constructor(private platform: WaveshareRelayHomebridgePlatform, private accessory: IPlatformAccessory) {
    this.platform.log.info('Begin adding accessory', accessory);
    const context = accessory.context as IWaveshareRelay;

    const { Manufacturer, Model, Name, On } = this.platform.Characteristic;

    // Set accessory information
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)
      .setCharacteristic(Manufacturer, 'Waveshare')
      .setCharacteristic(Model, `RPi Relay Board`);

    // Get the Lightbulb service
    this.service =
      accessory.getService(this.platform.Service.Lightbulb);

    if (!this.service) {
      this.service = accessory.addService(this.platform.Service.Lightbulb)
    }

    // Set the service name, this is what is displayed as the default name on the Home app
    this.service.setCharacteristic(Name, context.id);

    // Each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb
    this.service
      .getCharacteristic(On)
      .onGet(this.getState.bind(this))
      .updateValue(context.state === 1);
    
    this.service
      .getCharacteristic(On)
      .onSet(this.setState.bind(this));
  }

  /**
   *
   * @returns {Promise<import('homebridge').CharacteristicValue>}
   */
  async getState() {
    const { id } = this.accessory.context as IWaveshareRelay;
    this.platform.log.debug(`[${id}] begin reading state`);

    const relay = await this.platform.waveshareRelayApi.getRelay(id, this.platform.log);
    this.accessory.context = relay;

    this.platform.log.debug(`[${id}] state read as`, relay.state);

    return relay.state === 1;
  }

  /**
   *
   * @returns {Promise<import('homebridge').CharacteristicValue>}
   */
  async setState(state: boolean) {
    const { id } = this.accessory.context as IWaveshareRelay;
    this.platform.log.debug(`[${id}] begin reading state`);

    const relay = await this.platform.waveshareRelayApi.setRelay(id, state, this.platform.log);
    this.accessory.context = relay;

    this.platform.log.debug(`[${id}] state read as`, relay.state);

    return relay.state === 1;
  }
}
