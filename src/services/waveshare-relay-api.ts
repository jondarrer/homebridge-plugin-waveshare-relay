export class WaveshareRelayApi {
  constructor (private url: string) {}

  setRelay = async (id: string, level: Level): Promise<IWaveshareRelay> => {
    const result = await fetch(`${this.url}/${id}/${level === 0 ? 'off' : 'on'}`, { method: 'POST' });
    return result.json() as Promise<IWaveshareRelay>;
  }

  getRelay = async (id: string): Promise<IWaveshareRelay> => {
    const result = await fetch(`${this.url}/${id}`, { method: 'GET' });
    return result.json() as Promise<IWaveshareRelay>;
  }

  getRelays = async (): Promise<IWaveshareRelay[]> => {
    const result = await fetch(`${this.url}`, { method: 'GET' });
    return result.json() as Promise<IWaveshareRelay[]>;
  }
}

export type Level = 0 | 1;

export interface IWaveshareRelay {
  id: string;
  level: Level;
  gpio: number;
}