
# Openmove Journey

OpenTripPlanner Responsive Web Interface

![journey web app](docs/images/multi_modal_bike_ride.png)


## Preamble

This project is an Openmove customization of the library [otp-react-redux](https://github.com/opentripplanner/otp-react-redux) and [otp-ui](https://github.com/opentripplanner/otp-ui)

initially forked from: [trimet-mod-otp](https://github.com/ibi-group/trimet-mod-otp).

Development continued on the [Mentor project](https://github.com/noi-techpark/odh-mentor-otp).


## Development Setup and Configurations

1. Ensure that [Yarn](https://yarnpkg.com/en/) (v1.9+) and [Node.js](https://nodejs.org/en/) (v8.9+) are installed locally.

2. Clone the journey repository:

```bash
git clone https://github.com/openmove/journey.git
```

optionally you   can run local instance of OpenTripPlanner and other services
```bash
docker-compose up -d otp
```

### generation of config.yml

edit .env file if needed
```
API_HOST=https://tripplanner.openmove.com
API_PATH=/otp/routers/default
API_PORT=443
GEOCODER_BASEURL=http://localhost:8088
```

after changed some env var restart using ```yarn genconfig && yarn start``` or rebuild journey docker image

```bash
yarn install
```

only first time generate src/config.yml from environment vars and base /config.yml file
```bash
npm run genconfig
```

```
yarn start
```

browse http://localhost:8081/


3. Install dependencies using Yarn:

```bash
yarn install
```

4. Update the configuration file, `src/config.yml`, as needed.

- page title
- base URL path,
- OTP API,
- map base layers and overlays,
- enabled travel modes, and
- other settings.

See [`config.yml`](./config.yml) comments for details.

## Development:

### Running a local test instance

Run the `start` command with Yarn to deploy the application locally for testing. This command uses [webpack-dev-server](https://github.com/webpack/webpack-dev-server) and deploys to `http://localhost:8080`:

```bash
cd src
yarn start
```

### Building a bundle for production deployment

Run the `build` command with Yarn to bundle the application for production deployment. This command uses webpack running in production mode and produces minified/optimized code:

```bash
cd src
yarn build
```

This will build three files in the `dist/` directory: `index.html`, `bundle.js`, and `styles.css`. These files can then be deployed to any public-facing web server. Note: if deploying to a URL subdirectory, the path must match the `reactRouter.basename` property specified in `config.yml`.

### Using custom index.html, css, and js

Both the `yarn build` and `yarn start` commands are equipped with the ability to override the default `src/index.tpl.html`, `src/style.scss`, and `config.js` (not to mention the `config.yml`). This can be handy for injecting some custom scripts/widgets into the html (in a pinch), overriding the default branding, or configuring pieces of `config.js` like the icons used for modes (e.g., car, bus, or trolley) and the disclaimers shown in the sidebar footer.

To override these files, run the start/build command with any of the options specified with an absolute file path to the file override. For example:
