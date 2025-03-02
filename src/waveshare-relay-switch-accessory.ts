import { IPlatformAccessory, IService } from "./homebridge-types";
import { IWaveshareRelay, Level } from "./services/waveshare-relay-api";
import { WaveshareRelayHomebridgePlatform } from "./waveshare-relay-homebridge-platform";

/**
 * Represents the air temperature sensor on the thermostat
 */
export class WaveshareRelaySwitchAccessory {
  static TYPE = 'Relay';

  service: IService;

  /**
   *
   * @param {import('./warmup-homebridge-platform').WarmupHomebridgePlatform} platform
   * @param {import('homebridge').PlatformAccessory} accessory
   */
  constructor(private platform: WaveshareRelayHomebridgePlatform, private accessory: IPlatformAccessory) {
    const context = accessory.context as IWaveshareRelay;

    const { Manufacturer, Model, Name, On } = this.platform.Characteristic;

    // set accessory information
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)
      .setCharacteristic(Manufacturer, 'Waveshare')
      .setCharacteristic(Model, `RPi Relay Board`);

    // get the TemperatureSensor service if it exists, otherwise create a new TemperatureSensor service
    this.service =
      this.accessory.getService(this.platform.Service.Switch);

    // set the service name, this is what is displayed as the default name on the Home app
    this.service.setCharacteristic(Name, context.id);

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Switch
    this.service
      .getCharacteristic(On)
      .onGet(this.getState.bind(this))
      .updateValue(context.level);
    
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

    const relay = await this.platform.waveshareRelayApi.getRelay(id);
    this.accessory.context = relay;

    this.platform.log.debug(`[${id}] state read as`, relay.level);

    return relay.level;
  }

  /**
   *
   * @returns {Promise<import('homebridge').CharacteristicValue>}
   */
  async setState(level: Level) {
    const { id } = this.accessory.context as IWaveshareRelay;
    this.platform.log.debug(`[${id}] begin reading state`);

    const relay = await this.platform.waveshareRelayApi.setRelay(id, level);
    this.accessory.context = relay;

    this.platform.log.debug(`[${id}] state read as`, relay.level);

    return relay.level;
  }
}
