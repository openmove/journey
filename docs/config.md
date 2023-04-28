
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
