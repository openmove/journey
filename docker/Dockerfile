#FROM node:18.15.0-alpine3.16
FROM node:16.14.0-alpine3.14

ARG API_HOST=http://localhost \
		API_PATH=/otp/routers/default \
		API_PORT=8080 \
		FOLDER=/ \
		JOURNEY_THEME=default \
		GEOCODER_BASEURL=http://localhost/geocoder \
		PARKING_BASEURL=http://localhost/parking \
		DRT_BASEURL=http://localhost/drt \
		CHARGER_BASEURL=http://localhost/charger \
		CARSHARING_BASEURL=http://localhost/carsharing \
		TRAFFIC_BASEURL=http://localhost/traffic \
		GOOGLE_ANALYTICS_ID='' \
		MATOMO_BASE_URL=https://digital.matomo.cloud/ \
		MATOMO_SITE_ID=20

ENV API_HOST=$API_HOST \
		API_PATH=$API_PATH \
		API_PORT=$API_PORT \
		FOLDER=$FOLDER \
		JOURNEY_THEME=$JOURNEY_THEME \
		GEOCODER_BASEURL=$GEOCODER_BASEURL \
		PARKING_BASEURL=$PARKING_BASEURL \
		DRT_BASEURL=$DRT_BASEURL \
		CHARGER_BASEURL=$CHARGER_BASEURL \
		CARSHARING_BASEURL=$CARSHARING_BASEURL \
		TRAFFIC_BASEURL=$TRAFFIC_BASEURL \
		GOOGLE_ANALYTICS_ID=$GOOGLE_ANALYTICS_ID \
		MATOMO_BASE_URL=${MATOMO_BASE_URL} \
		MATOMO_SITE_ID=${MATOMO_SITE_ID}

#TODO ENV NODE_ENV=production
#before resolve npm dependecies

RUN apk add --no-cache \
	bash \
	nginx && \
	mkdir -p /run/nginx && \
	mkdir -p /var/www/html

RUN mkdir -p /journey

COPY . /journey

WORKDIR /journey

RUN yarn install && yarn build

RUN mv dist/* /var/www/html/
RUN mv static /var/www/html/static

COPY ./docker/docker-entrypoint.sh /docker-entrypoint.sh

ENTRYPOINT ["/bin/bash"]
CMD ["/docker-entrypoint.sh"]
