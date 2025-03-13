import { ILogger, IPlatformConfig, IAPI, IDynamicPlatformPlugin, IService, ILightbulb, ICharacteristic, IPlatformAccessory, ECategories } from './homebridge-types';
import { IWaveshareRelay, WaveshareRelayApi } from './services/waveshare-relay-api';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { WaveshareRelayLightbulbAccessory } from './waveshare-relay-lightbulb-accessory';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 * @implements {IDynamicPlatformPlugin}
 */
export class WaveshareRelayHomebridgePlatform implements IDynamicPlatformPlugin {
  public Service: IService;
  public Characteristic: ICharacteristic;
  public name: string;
  public accessories: IPlatformAccessory[] = [];
  public waveshareRelayApis: WaveshareRelayApi[] = [];

  /**
   *
   * @param log
   * @param config
   * @param api
   */
  constructor(public log: ILogger, public config: IPlatformConfig, public api: IAPI) {
    this.log.debug('Begin initializing platform:', this.config.name);
    this.Service = this.api.hap.Service;
    this.Characteristic = this.api.hap.Characteristic;

    // Extract name from config
    this.name = config.name;
    this.log.debug('Finished initializing platform:', this.config.name);

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', async () => {
      this.log.debug('Executing didFinishLaunching callback');

      if (this.config.waveshareUrls) {
        this.waveshareRelayApis = (this.config.waveshareUrls as string[]).map((waveshareUrl) => new WaveshareRelayApi(waveshareUrl));
        try {
          await this.discoverDevices();
        } catch (error) {
          // const err = error as Error;
          this.log.error('Failed when running discoverDevices', { cause: error });
        }
      } else {
        this.log.info(
          'No waveshareUrls available, doing nothing. Hint: Configure the plugin by assigning waveshare urls. Then restart Homebridge to complete plugin activation.'
        );
      }
    });
  }

  /**
   * Invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   * @param accessory
   */
  configureAccessory = (accessory: IPlatformAccessory) => {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // Add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  };

  /**
   * Discover and register Waveshare relays.
   * Accessories must only be registered once, so previously created accessories
   * are not registered again to prevent "duplicate UUID" errors.
   */
  discoverDevices = async () => {
    const logger = this.log;
    const relays = await flatMapAsync<WaveshareRelayApi, IWaveshareRelay>(this.waveshareRelayApis, async (waveshareRelayApi) => await waveshareRelayApi.getRelays(logger));

    this.log.debug(`Discovered ${relays.length} relay(s).`);

    // Loop over the relays and register/update each one
    for (const relay of relays) {
      this.log.debug(`Begin processing relay ${WaveshareRelayApi.buildRelayGuid(relay)} with pin ${relay.pin}.`);
      this.updateOrRegisterRelay(relay);
    }

    // Unregister any accessories that we no longer have
    for (let i = 0; i < this.accessories.length; i++) {
      const existingAccessory = this.accessories[i];
      if (!relays.find(relay => WaveshareRelayApi.buildRelayGuid(relay) === WaveshareRelayApi.buildRelayGuid(existingAccessory.context as IWaveshareRelay))) {
        // the accessory no longer exists
        this.log.info('Removing unavailable accessory from the cache:', existingAccessory.displayName);

        // Remove platform accessories that are no longer present
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
      }
    }
  };

  updateOrRegisterRelay = (relay: IWaveshareRelay) => {
    const relayGuid = WaveshareRelayApi.buildRelayGuid(relay);
    const uuid = this.api.hap.uuid.generate(relayGuid);
    this.log.debug(`Processing relay ${relayGuid} with pin ${relay.pin}.`);

    // See if an accessory with the same uuid has already been registered and restored from
    // the cached devices we stored in the `configureAccessory` method above
    const existingAccessory = this.accessories.find((accessory) => accessory.UUID === uuid);

    if (existingAccessory) {
      // The accessory already exists
      this.log.info('Restoring existing relay from cache:', existingAccessory.displayName);

      this.api.updatePlatformAccessories([existingAccessory]);

      // Create the accessory handler for the restored accessory
      new WaveshareRelayLightbulbAccessory(this, existingAccessory);
    } else {
      // The accessory does not yet exist, so we need to create it
      this.log.info('Adding new relay:', `${relayGuid} with pin ${relay.pin}.`);

      // Create a new accessory, with displayName set to relay.name
      const accessory = new this.api.platformAccessory(relay.name, uuid, this.api.hap.Categories.LIGHTBULB);

      // Store a copy of the device object in the `accessory.context`
      // the `context` property can be used to store any data about the accessory you may need
      accessory.context = relay;

      // Create the accessory handler for the newly create accessory
      // this is imported from `platformAccessory.ts`
      new WaveshareRelayLightbulbAccessory(this, accessory);

      // Link the accessory to your platform
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }
  };
}

const flatMapAsync = async<T, U>(arr: T[], fn: (item: T) => Promise<U[]>): Promise<U[]> =>
  (await Promise.all(arr.map(fn))).flat();