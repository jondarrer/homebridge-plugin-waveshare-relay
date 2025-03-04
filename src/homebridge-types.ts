export interface ILogger {
  info(message: string, ...parameters: unknown[]): void;
  warn(message: string, ...parameters: unknown[]): void;
  error(message: string, ...parameters: unknown[]): void;
  debug(message: string, ...parameters: unknown[]): void;
}

export interface IPlatformConfig {
  name: string;
  [key: string]: unknown;
}

interface IPlatformAccessoryConstructor {
  /**
   * Returns a new Gpio object for accessing a GPIO
   * @param gpio An unsigned integer specifying the GPIO number
   * @param options (optional)
   */
  new (displayName: string, uuid: string, category?: ECategories): IPlatformAccessory;
}

export interface IPlatformAccessory {
  displayName: string;
  UUID: string;
  context: unknown;

  getService: (service: string) => IService;
  addService: (service: string) => IService;
}

export interface IAPI {
  on(event: 'didFinishLaunching', listener: () => void): this;
  on(event: 'shutdown', listener: () => void): this;
  registerPlatform(platformName: string, constructor: unknown): void;
  updatePlatformAccessories(accessories: IPlatformAccessory[]): void;
  registerPlatformAccessories(plaformName: string, pluginName: string, accessories: IPlatformAccessory[]): void;
  unregisterPlatformAccessories(plaformName: string, pluginName: string, accessories: IPlatformAccessory[]): void;
  platformAccessory: IPlatformAccessoryConstructor;
  hap: {
    Service: IService;
    Characteristic: ICharacteristic;
    Categories: typeof ECategories;
    uuid: {
      generate: (id: string) => ''
    }
    [key: string]: unknown;
  };
}

export interface IService {
  new (uuid: string, name?: string, subtype?: string): unknown;
  getCharacteristic(characteristic: ICharacteristic): ICharacteristic;
  setCharacteristic(characteristic: ICharacteristic, value: string): ICharacteristic;
  Lightbulb: string;
  AccessoryInformation: string;
};

export interface ILightbulb extends IService {
  new (name: string, subtype?: string): IService;
};

export interface ICharacteristic {
  new (uuid: string): unknown;
  onGet(handler: Function): ICharacteristic;
  onSet(handler: Function): ICharacteristic;
  setCharacteristic(characteristic: ICharacteristic, value: string): ICharacteristic;
  updateValue(value: unknown): ICharacteristic;
  On: ICharacteristic;
  Manufacturer: ICharacteristic;
  Model: ICharacteristic;
  Name: ICharacteristic;
  Formats: Record<string, unknown>;
  Units: Record<string, unknown>;
  Perms: Record<string, unknown>;
};

export interface IDynamicPlatformPlugin {
  configureAccessory(accessory: unknown): void;
}

/**
 * Known category values. Category is a hint to iOS clients about what "type" of Accessory this represents, for UI only.
 *
 * @group Accessory
 */
export enum ECategories {
  LIGHTBULB = 5,
  SWITCH = 8,
}
