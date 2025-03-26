import { HAPMock } from './hap-mock.js';
import { PlatformAccessoryMock } from './platform-accessory-mock.js';

export interface IPlatformAccessoryConstructor {
  new (displayName: string, uuid: string, category: number): typeof PlatformAccessoryMock;
  prototype: PlatformAccessoryMock;
}

export class APIMock {
  __handlers: Record<string, (...args: unknown[]) => unknown> = {};

  set = (_value: unknown) => {};
  get = () => {
    return 'this.value' as unknown;
  };

  onSet = (fn: (value: unknown) => void) => {
    this.set = fn;
    this.on('set', fn);
    return this;
  };
  onGet = (fn: () => unknown) => {
    this.get = fn;
    this.on('get', fn);
    return this;
  };

  on = (eventName: string, fn: (...args: unknown[]) => unknown) => (this.__handlers[eventName] = fn);
  emit = async (eventName: string, args?: unknown) => await this.__handlers[eventName](args);

  hap = new HAPMock();

  registerPlatformAccessories = (_pluginName: string, _platformName: string, _accessories: any[]) => {};
  unregisterPlatformAccessories = (_pluginName: string, _platformName: string, _accessories: any[]) => {};
  updatePlatformAccessories = (_pluginName: string, _platformName: string, _accessories: any[]) => {};

  platformAccessory: IPlatformAccessoryConstructor = PlatformAccessoryMock as unknown as IPlatformAccessoryConstructor;

  log = console.log;
}
