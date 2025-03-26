export class CharacteristicMock {
  __handlers: Record<string, (...args: unknown[]) => unknown> = {};
  [x: string]: unknown;
  static Manufacturer = new CharacteristicMock('Manufacturer');
  static Model = new CharacteristicMock('Model');
  static SerialNumber = new CharacteristicMock('SerialNumber');
  static Name = new CharacteristicMock('Name');
  static On = new CharacteristicMock('On');

  value: unknown = null;
  set = (_value: unknown) => {};
  get = () => {
    return this.value;
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

  setProps = () => this;
  updateValue = (value: unknown) => (this.value = value);

  constructor(public name: string) {}
}
