/* eslint @typescript-eslint/no-extraneous-class: "off" */
export class UserMock {
  public static customStoragePath? = undefined;
  public static storageAccessed = false;
  static configPath(): string {
    return '';
  }
  static persistPath(): string {
    return '';
  }
  static cachedAccessoryPath(): string {
    return '';
  }
  static storagePath(): string {
    return '';
  }
  static setStoragePath(..._storagePathSegments: string[]): void {}
}
