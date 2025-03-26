import { describe, it, beforeEach, afterEach, mock, TestContext } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import jsdom from 'jsdom';

const __dirname = dirname(fileURLToPath(import.meta.url));

let dom: jsdom.JSDOM;
let pluginConfig: {
  length: number;
  0: unknown;
  push: any;
};
let page: string;
let glob: {
  homebridge: {
    getPluginConfig: any;
    updatePluginConfig: any;
    toast: {
      error: any;
      success: any;
    };
    showSpinner: any;
    hideSpinner: any;
    request: any;
  };
};

// For debugging purposes, publish the page's console.log statement
// Uncomment the following:
// const virtualConsole = new jsdom.VirtualConsole();
// virtualConsole.sendTo(console);
// To undo the above, try
// virtualConsole.removeAllListeners();

beforeEach((t) => {
  // Setting the mocks here allows us to use mock.reset() in afterEach.
  pluginConfig = {
    length: 0,
    0: {},
    push: (t as TestContext).mock.fn(),
  };
  glob = {
    homebridge: {
      getPluginConfig: (t as TestContext).mock.fn(),
      updatePluginConfig: (t as TestContext).mock.fn(),
      toast: {
        error: (t as TestContext).mock.fn(),
        success: (t as TestContext).mock.fn(),
      },
      showSpinner: (t as TestContext).mock.fn(),
      hideSpinner: (t as TestContext).mock.fn(),
      request: (t as TestContext).mock.fn(),
    },
  };
  glob.homebridge.getPluginConfig.mock.mockImplementation(() => Promise.resolve(pluginConfig));
  page = readFileSync(join(__dirname, './index.html'), { encoding: 'utf-8' });
});

afterEach(() => {
  mock.reset();
  dom.window.close();
});

describe('Initial plugin configuration', () => {
  it('should add a new plugin config when no token exists yet', async () => {
    // Arrange & Act
    dom = new jsdom.JSDOM(page, {
      runScripts: 'dangerously',
      beforeParse(window) {
        window.homebridge = glob.homebridge;
      },
    });
    await wait();

    // Assert
    assert.ok(glob.homebridge.getPluginConfig.mock.callCount() > 0);
    assert.deepEqual(pluginConfig.push.mock.calls[0].arguments[0], { name: 'HomebridgePluginWaveshareRelay' });
  });

  it('should validate the urls field', async () => {
    // Arrange & Act
    dom = new jsdom.JSDOM(page, {
      runScripts: 'dangerously',
      beforeParse(window) {
        window.homebridge = glob.homebridge;
      },
    });
    await wait();

    (dom.window.document.getElementById('saveButton') as HTMLButtonElement).click();

    // Assert
    assert.equal(glob.homebridge.toast.error.mock.callCount(), 1);
    assert.deepEqual(glob.homebridge.toast.error.mock.calls[0].arguments, [
      'Waveshare server urls must be provided.',
      'Error',
    ]);
  });

  it('should show the spinner', async () => {
    // Arrange & Act
    dom = new jsdom.JSDOM(page, {
      runScripts: 'dangerously',
      beforeParse(window) {
        window.homebridge = glob.homebridge;
      },
    });
    await wait();

    (dom.window.document.getElementById('urls') as HTMLInputElement).value = 'http://waveshare1';
    (dom.window.document.getElementById('saveButton') as HTMLButtonElement).click();
    await wait();

    // Assert
    assert.equal(glob.homebridge.showSpinner.mock.callCount(), 1);
  });

  it('should hide the spinner', async () => {
    // Arrange & Act
    dom = new jsdom.JSDOM(page, {
      runScripts: 'dangerously',
      beforeParse(window) {
        window.homebridge = glob.homebridge;
      },
    });
    await wait();

    (dom.window.document.getElementById('urls') as HTMLInputElement).value = 'http://waveshare1';
    (dom.window.document.getElementById('saveButton') as HTMLButtonElement).click();
    await wait();

    // Assert
    assert.equal(glob.homebridge.hideSpinner.mock.callCount(), 1);
  });

  it('should update the plugin config when successful', async () => {
    // Arrange
    const urls = ['http://waveshare1'];
    const servers = [{ relays: [{ name: 'Mirror Light', id: 'http://waveshare1#CH1', pin: '26' }] }];
    glob.homebridge.request.mock.mockImplementation(() => Promise.resolve(servers));

    // Act
    dom = new jsdom.JSDOM(page, {
      runScripts: 'dangerously',
      beforeParse(window) {
        window.homebridge = glob.homebridge;
      },
    });
    await wait();

    (dom.window.document.getElementById('urls') as HTMLInputElement).value = urls.join(',');
    (dom.window.document.getElementById('saveButton') as HTMLButtonElement).click();
    await wait();

    // Assert
    assert.ok(glob.homebridge.updatePluginConfig.mock.callCount() > 0);
    assert.deepEqual(glob.homebridge.updatePluginConfig.mock.calls[0].arguments[0]['0'], { waveshareUrls: urls });
    assert.ok(glob.homebridge.toast.success.mock.callCount() > 0);
    assert.deepEqual(glob.homebridge.toast.success.mock.calls[0].arguments, ['Saved', 'Success']);
  });

  it('should show relay information', async () => {
    // Arrange
    const urls = ['http://waveshare1'];
    const servers = [{ relays: [{ name: 'Mirror Light', id: 'http://waveshare1#CH1', pin: '26' }] }];
    glob.homebridge.request.mock.mockImplementation(() => Promise.resolve(servers));

    // Act
    dom = new jsdom.JSDOM(page, {
      runScripts: 'dangerously',
      beforeParse(window) {
        window.homebridge = glob.homebridge;
      },
    });
    await wait();
    (dom.window.document.getElementById('urls') as HTMLInputElement).value = urls.join(',');
    (dom.window.document.getElementById('saveButton') as HTMLButtonElement).click();
    await wait();

    // Assert
    const relay = servers[0].relays[0];
    assert.equal(
      (dom.window.document.getElementById('associated-relays') as HTMLElement).innerHTML,
      `

      <li>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-toggles" viewBox="0 0 16 16">
          <path d="M4.5 9a3.5 3.5 0 1 0 0 7h7a3.5 3.5 0 1 0 0-7zm7 6a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5m-7-14a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5m2.45 0A3.5 3.5 0 0 1 8 3.5 3.5 3.5 0 0 1 6.95 6h4.55a2.5 2.5 0 0 0 0-5zM4.5 0h7a3.5 3.5 0 1 1 0 7h-7a3.5 3.5 0 1 1 0-7"></path>
        </svg>
        <span>${relay.name || 'Unnamed'} (channel ${relay.id}, pin ${relay.pin})</span>
      </li>`
    );
  });

  it('should handle the error upon 200 failure', async () => {
    // Arrange
    glob.homebridge.request.mock.mockImplementation(() =>
      Promise.resolve({
        error: 'some error',
      })
    );

    // Act
    dom = new jsdom.JSDOM(page, {
      runScripts: 'dangerously',
      beforeParse(window) {
        window.homebridge = glob.homebridge;
      },
    });
    await wait();

    (dom.window.document.getElementById('urls') as HTMLInputElement).value = 'http://waveshare1';
    (dom.window.document.getElementById('saveButton') as HTMLButtonElement).click();
    await wait();

    // Assert
    assert.equal(glob.homebridge.updatePluginConfig.mock.callCount(), 0);
    assert.deepEqual(glob.homebridge.toast.error.mock.calls[0].arguments, [undefined, 'some error']);
  });

  it('should handle the error upon error thrown failure', async () => {
    // Arrange
    glob.homebridge.request.mock.mockImplementation(() => Promise.reject(new Error('Some error has occurred')));

    //Act
    dom = new jsdom.JSDOM(page, {
      runScripts: 'dangerously',
      beforeParse(window) {
        window.homebridge = glob.homebridge;
      },
    });
    await wait();

    (dom.window.document.getElementById('urls') as HTMLInputElement).value = 'http://waveshare1';
    (dom.window.document.getElementById('saveButton') as HTMLButtonElement).click();
    await wait();

    // Assert
    assert.equal(glob.homebridge.updatePluginConfig.mock.callCount(), 0);
    assert.deepEqual(glob.homebridge.toast.error.mock.calls[0].arguments, [undefined, 'Some error has occurred']);
  });

  it('should handle the error thrown by updatePluginConfig', async () => {
    // Arrange
    const urls = ['http://waveshare1'];
    const servers = [{ relays: [{ name: 'Mirror Light', id: 'http://waveshare1#CH1', pin: '26' }] }];
    glob.homebridge.request.mock.mockImplementation(() => Promise.resolve(servers));
    glob.homebridge.updatePluginConfig.mock.mockImplementation(() =>
      Promise.reject(new Error('updatePluginConfig threw this error'))
    );

    // Act
    dom = new jsdom.JSDOM(page, {
      runScripts: 'dangerously',
      beforeParse(window) {
        window.homebridge = glob.homebridge;
      },
    });
    await wait();

    (dom.window.document.getElementById('urls') as HTMLInputElement).value = urls.join(',');
    (dom.window.document.getElementById('saveButton') as HTMLButtonElement).click();
    await wait();

    // Assert
    assert.deepEqual(glob.homebridge.toast.error.mock.calls[0].arguments, [
      undefined,
      'updatePluginConfig threw this error',
    ]);
  });
});

describe('Subsequent plugin configuration', () => {
  it('should show relay information', async () => {
    // Arrange
    const urls = ['http://waveshare1'];
    const servers = [{ relays: [{ name: 'Mirror Light', id: 'http://waveshare1#CH1', pin: '26' }] }];
    pluginConfig.length = 1;
    pluginConfig[0] = { waveshareUrls: urls };
    glob.homebridge.request.mock.mockImplementation(() => Promise.resolve(servers));
    glob.homebridge.updatePluginConfig.mock.mockImplementation(() => Promise.resolve(pluginConfig));

    // Act
    dom = new jsdom.JSDOM(page, {
      runScripts: 'dangerously',
      beforeParse(window) {
        window.homebridge = glob.homebridge;
      },
    });
    await wait();

    // Assert
    const relay = servers[0].relays[0];
    assert.equal(
      (dom.window.document.getElementById('associated-relays') as HTMLElement).innerHTML,
      `

      <li>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-toggles" viewBox="0 0 16 16">
          <path d="M4.5 9a3.5 3.5 0 1 0 0 7h7a3.5 3.5 0 1 0 0-7zm7 6a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5m-7-14a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5m2.45 0A3.5 3.5 0 0 1 8 3.5 3.5 3.5 0 0 1 6.95 6h4.55a2.5 2.5 0 0 0 0-5zM4.5 0h7a3.5 3.5 0 1 1 0 7h-7a3.5 3.5 0 1 1 0-7"></path>
        </svg>
        <span>${relay.name || 'Unnamed'} (channel ${relay.id}, pin ${relay.pin})</span>
      </li>`
    );
  });
});

const wait = (millis = 0) => new Promise((resolve) => setTimeout(resolve, millis));
