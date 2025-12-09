import { IAPI } from './homebridge-types.js';
import { PLATFORM_NAME } from './settings.js';
import { WaveshareRelayHomebridgePlatform } from './waveshare-relay-homebridge-platform.js';

/**
 * This method registers the platform with Homebridge
 */
export default (api: IAPI) => {
  api.registerPlatform(PLATFORM_NAME, WaveshareRelayHomebridgePlatform);
};
