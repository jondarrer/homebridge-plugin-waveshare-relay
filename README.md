# homebridge-plugin-waveshare-relay

Homebridge plugin exposing Waveshare Raspberry Pi Relay Board as a series of switches.

## Developing

### Clone and install dependencies

```sh
git clone git@github.com:jondarrer/homebridge-plugin-waveshare-relay
cd homebridge-plugin-waveshare-relay
yarn
```

### Testing

Run the tests with the usual command:

```sh
yarn test
```

Debug within VS Code by running the `npm run local-homebridge` task.

### Building and publishing

```sh
yarn build
npm version patch -m "%s"
git push && git push --tags
```

### Running Dockerised Homebridge for integration testing

NB. Requires `docker-compose`.

```sh
npm run containerised-homebridge
```

This will build the plugin and copy the necessary files to the appropriate places within container volume space (`./volumes/homebridge`). It will then start it, making it available at [http://localhost:8581](http://localhost:8581).

It is necessary to re-run this process on changes to the source code.

To stop the container, simply run `docker-compose down`.
