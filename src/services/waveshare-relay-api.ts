import { ILogger } from '../homebridge-types';

export class WaveshareRelayApi {
  constructor(public url: string) {}

  async setRelay(id: string, state: boolean, log: ILogger): Promise<IWaveshareRelay> {
    log.debug(`setRelay ${this.url}#${id} ${state}`);
    const result = await fetch(`${this.url}/${id}/${state ? 'on' : 'off'}`, { method: 'POST' });
    const json = (await result.json()) as IWaveshareRelay;
    json.url = this.url;
    log.debug(`setRelay result ${result.status}`, json);
    return json;
  }

  async getRelay(id: string, log: ILogger): Promise<IWaveshareRelay> {
    log.debug(`getRelay ${this.url}#${id}`);
    const result = await fetch(`${this.url}/${id}`, { method: 'GET' });
    const json = (await result.json()) as IWaveshareRelay;
    json.url = this.url;
    log.debug(`getRelay result ${result.status}`, json);
    return json;
  }

  async getRelays(log: ILogger): Promise<IWaveshareRelay[]> {
    log.debug(`getRelays`);
    const result = await fetch(`${this.url}`, { method: 'GET' });
    const json = (await result.json()) as IWaveshareRelay[];
    json.forEach((relay) => (relay.url = this.url));
    log.debug(`getRelays result ${result.status}`, json);
    return json;
  }

  static buildRelayGuid(relay: IWaveshareRelay): string {
    return `${relay.url}#${relay.id}`;
  }
}

export type TState = 0 | 1;

export interface IWaveshareRelay {
  url: string;
  id: string;
  pin: number;
  name: string;
  state: TState;
}
