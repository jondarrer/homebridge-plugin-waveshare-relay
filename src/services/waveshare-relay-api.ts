import { ILogger } from "../homebridge-types";

export class WaveshareRelayApi {
  constructor (private url: string) {}

  setRelay = async (id: string, state: boolean, log: ILogger): Promise<IWaveshareRelay> => {
    log.debug(`setRelay ${id} ${state}`);
    const result = await fetch(`${this.url}/${id}/${state ? 'off' : 'on'}`, { method: 'POST' });
    const json = await result.json() as IWaveshareRelay;
    log.debug(`setRelay result ${result.status}`, json);
    return json;
  };

  getRelay = async (id: string, log: ILogger): Promise<IWaveshareRelay> => {
    log.debug(`getRelay ${id}`);
    const result = await fetch(`${this.url}/${id}`, { method: 'GET' });
    const json = await result.json() as IWaveshareRelay;
    log.debug(`getRelay result ${result.status}`, json);
    return json;
  };

  getRelays = async (log: ILogger): Promise<IWaveshareRelay[]> => {
    log.debug(`getRelays`);
    const result = await fetch(`${this.url}`, { method: 'GET' });
    const json = await result.json() as IWaveshareRelay[];
    log.debug(`getRelays result ${result.status}`, json);
    return json;
  };
}

export type TState = 0 | 1;

export interface IWaveshareRelay {
  id: string;
  pin: number;
  state: TState;
}