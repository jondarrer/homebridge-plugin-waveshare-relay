import { CharacteristicMock } from './characteristic-mock.js';

export class ServiceMock {
  static AccessoryInformation = new ServiceMock('AccessoryInformation');
  static Thermostat = new ServiceMock('Thermostat');
  static TemperatureSensor = new ServiceMock('TemperatureSensor');
  static Lightbulb = new ServiceMock('Lightbulb');

  constructor(public name: string) {}

  getCharacteristic = (characteristic: CharacteristicMock) => characteristic;
  setCharacteristic = (_characteristic: CharacteristicMock, _value: unknown) => this;
}
