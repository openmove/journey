
/**
 * Create customized geocoder functions given a certain geocoding API, the
 * config for the geocoder and response rewrite functions specific to this
 * application. Any geocoder api that is added is expected to have an API that
 * behaves very closely to https://github.com/conveyal/isomorphic-mapzen-search
 */
export default class Geocoder {
  constructor(geocoderApi, geocoderConfig) {
    this.api = geocoderApi;
    this.geocoderConfig = geocoderConfig;
  }

  /**
   * Perform an autocomplete query. Eg, using partial text of a possible
   * address or POI, attempt to find possible matches.
   */
  autocomplete(query) {
    console.log('query',query);

    const {
      apiKey,
      baseUrl,
      boundary,
      focusPoint,
      options,
      sources
    } = this.geocoderConfig;

		// const latitude = params.lat,
		// 	longitude = params.lon,
		  const	limit = 20,//params.maxresults,
			country = 'IT',//params.country,
			{maxLat, minLon, minLat, maxLon} = boundary.rect,
			//bbox = `${maxLat},${minLon},${minLat},${maxLon}`,
			bbox = `${minLon},${minLat},${maxLon},${maxLat}`,
			// lang = params.language,
			// text = encodeURIComponent(query),
       {text} = query,
			 url = 'https://autosuggest.search.hereapi.com/v1/autosuggest?'
       +`q=${text}`
				+`&apiKey=${apiKey}`
				// +`&lang=${lang}`
				+'&result_types=address,place'
				+`&in=bbox:${bbox}`
				+`&in=countryCode:${country}`
				+`&limit=${limit}`;

        return fetch(url).then((response) => response.json()).then((results)=>(this.convertResultsToFeatures(results)))
  }

  convertResultsToFeatures(results){
    console.log('results',results);
    // retro compatibility function
    // note: not all fields are converted only the strictly needed ones
    const features = []
    if(!results) {
      return features;
    }
    results.items.forEach((item)=>{
      const feature = {properties:{}}

      feature.properties.source = 'here' // needed for compatibility with location field options
      feature.properties.label =  item.title//item.address.label

      features.push({
        ... item, // original item
        ...feature,
      })
    })

    return {features};
  }

  /**
   * Get an application-specific data structure from a given feature. The
   * feature is either the result of an autocomplete or a search query. This
   * function returns a Promise because sometimes an asynchronous action
   * needs to be taken to translate a feature into a location. For example,
   * the ArcGIS autocomplete service returns results that lack full address
   * data and GPS and it is expected that an extra call to the `search` API is
   * done to obtain that detailed data.
   */
  getLocationFromGeocodedFeature(item) {
    console.log('result',item);
    const locationToReturn =  {}
     locationToReturn.lat = item.position.lat// lonlat.fromLatlng(result.position);
     locationToReturn.lon = item.position.lng
    locationToReturn.name = item.title //feature.address.label;
    // location.rawGeocodedFeature = feature; // not used
    console.log(locationToReturn);
    return Promise.resolve(locationToReturn);
  }

  /**
   * Do a reverse-geocode. ie get address information and attributes given a
   * GPS coordiante.
   */
  reverse(query) {
    return this.api
      .reverse(this.getReverseQuery(query))
      .then(this.rewriteReverseResponse);
  }

  /**
   * Perform a search query. A search query is different from autocomplete in
   * that it is assumed that the text provided is more or less a complete
   * well-fromatted address.
   */
  search(query) {
    return this.api
      .search(this.getSearchQuery(query))
      .then(this.rewriteSearchResponse);
  }

  /**
   * Default autocomplete query generator
   */
 /*  getAutocompleteQuery(query) {
    const {
      apiKey,
      baseUrl,
      boundary,
      focusPoint,
      options
    } = this.geocoderConfig;

    return {
      apiKey,
      boundary,
      focusPoint,
      options,
      url: baseUrl ? `${baseUrl}/autocomplete` : undefined,
      ...query
    };
  } */

  /**
   * Default reverse query generator
   */
  getReverseQuery(query) {
    const { apiKey, baseUrl, options } = this.geocoderConfig;
    return {
      apiKey,
      format: true,
      options,
      url: baseUrl ? `${baseUrl}/reverse` : undefined,
      ...query
    };
  }

  /**
   * Default search query generator.
   */
  getSearchQuery(query) {
    const {
      apiKey,
      baseUrl,
      boundary,
      focusPoint,
      options
    } = this.geocoderConfig;
    return {
      apiKey,
      boundary,
      focusPoint,
      options,
      url: baseUrl ? `${baseUrl}/search` : undefined,
      format: false, // keep as returned GeoJSON,
      ...query
    };
  }

  /**
   * Default rewriter for autocomplete responses
   */
  rewriteAutocompleteResponse(response) {
    return response;
  }

  /**
   * Default rewriter for reverse responses
   */
  rewriteReverseResponse(response) {
    return response;
  }

  /**
   * Default rewriter for search responses
   */
  rewriteSearchResponse(response) {
    return response;
  }
}
