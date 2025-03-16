# Use a base Node.js image
FROM node:20-alpine
# FROM homebridge/homebridge:latest

# Set environment variables
ENV HOMEBRIDGE_USER /homebridge
ENV PATH $HOMEBRIDGE_USER/node_modules/.bin:$PATH

# Install necessary dependencies
RUN apk add --no-cache \
  avahi \
  dbus \
  git \
  make \
  g++ \
  python3

# Create a directory for Homebridge and set permissions
RUN mkdir -p $HOMEBRIDGE_USER && chown -R node:node $HOMEBRIDGE_USER
WORKDIR $HOMEBRIDGE_USER

# Clone Homebridge branch
# USER node
RUN git clone --depth 1 https://github.com/homebridge/homebridge.git $HOMEBRIDGE_USER

# Install Homebridge and dependencies
RUN npm install
RUN npm run build

# Install the UI
RUN npm install -g homebridge-config-ui-x

RUN mkdir -p $HOMEBRIDGE_USER/node_modules/homebridge-plugin-waveshare-relay/dist/
RUN mkdir -p $HOMEBRIDGE_USER/node_modules/homebridge-plugin-waveshare-relay/node_modules/
RUN mkdir -p $HOMEBRIDGE_USER/node_modules/homebridge-plugin-waveshare-relay/.yarn/

COPY ./config.schema.json $HOMEBRIDGE_USER/node_modules/homebridge-plugin-waveshare-relay/
COPY ./yarn.lock $HOMEBRIDGE_USER/node_modules/homebridge-plugin-waveshare-relay/
COPY ./package.json $HOMEBRIDGE_USER/node_modules/homebridge-plugin-waveshare-relay/
COPY ./dist/ $HOMEBRIDGE_USER/node_modules/homebridge-plugin-waveshare-relay/dist/
COPY ./node_modules/ $HOMEBRIDGE_USER/node_modules/homebridge-plugin-waveshare-relay/node_modules/
COPY ./.yarn/ $HOMEBRIDGE_USER/node_modules/homebridge-plugin-waveshare-relay/.yarn/

COPY ./volumes/config.json $HOMEBRIDGE_USER/config.json

# Expose necessary ports
EXPOSE 8581

# Define entrypoint
# ENTRYPOINT ["/bin/sh"]
# CMD ["which", "npm"]
# CMD cat package.json
CMD npm run watch -- -U $HOMEBRIDGE_USER