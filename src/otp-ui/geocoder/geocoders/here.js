
/**
 * Create customized geocoder functions given a certain geocoding API, the
 * config for the geocoder and response rewrite functions specific to this
 * application. Any geocoder api that is added is expected to have an API that
 * behaves very closely to https://github.com/conveyal/isomorphic-mapzen-search
 */

const defaultsApi = {
  autocomplete: 'https://autosuggest.search.hereapi.com/v1/autosuggest'
}

export default class Geocoder {
  constructor( geocoderConfig) {
    this.api = geocoderConfig.api || defaultsApi;
    this.geocoderConfig = geocoderConfig;
  }

  fetch(type, query, rewriteResponse){
    const url = this.api[type] || defaultsApi[type];
    return fetch( url + query)
      .then((response) => response.json())
      .then((results)=>rewriteResponse(results))
  }

  /**
   * Perform an autocomplete query. Eg, using partial text of a possible
   * address or POI, attempt to find possible matches.
   */
  autocomplete(query) {
    return this.fetch(
      'autocomplete',
      this.getAutocompleteQuery(query),
      (results)=>this.convertResultsToFeatures(results)
    )
  }

  mapCategories(hereCategories){

    if(!Array.isArray(hereCategories)){
      console.error('not an array') // TODO: REMOVE
      return;
    }

    if(hereCategories.length>1 && !hereCategories[0].primary){
      console.error('what') // TODO: REMOVE
    }

    const hereCategory = hereCategories[0]?.id;
    const [macroCategoryNumber, subCategoryNumber] = hereCategory.split('-')

    switch(macroCategoryNumber){
      case '100': return 'food'
      case '200':
        switch(subCategoryNumber){
          case '2300': // Gambling-Lottery-Betting incorporated in nightlife
          case '2000': return 'nightlife'
          case '2100': return 'cinema'
          case '2200': return 'theater'
        }
      case '300': return 'landmark'
      case '350': return 'nature'
      case '400': return 'transport'
      case '500': return 'accommodation'
      case '550':
        switch(subCategoryNumber){
          case '5510': return  'nature'// outdoor
          case '5520': return  'landmark' //leisure
        }
      case '600': return 'shop'
      case '700': return 'services' // BusinessAndServices
      case '800': return 'facilities'
      case '900': return 'buildings' // AreasAndBuildings
      default: console.error('invalid category',hereCategory)
    }
  }

  convertResultsToFeatures(results){
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
      feature.properties.category = this.mapCategories(item.categories)

      if(item.position){
        // ignore results without coordinates
        features.push({
          ... item, // original item
          ...feature,
        })
      }
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
    const locationToReturn =  {}
     locationToReturn.lat = item.position.lat// lonlat.fromLatlng(result.position);
     locationToReturn.lon = item.position.lng
    locationToReturn.name = item.title //feature.address.label;
    // location.rawGeocodedFeature = feature; // not used
    return Promise.resolve(locationToReturn);
  }

  /**
   * Do a reverse-geocode. ie get address information and attributes given a
   * GPS coordiante.
   */
  reverse(query) {
    // TODO: implement
    // now it returns the query
    return new Promise((resolve, reject) => {
      resolve(query.point)
    });

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
    // TODO: implement now returns nothing
    return new Promise((resolve, reject) => resolve({features:[]}))

    return this.api
      .search(this.getSearchQuery(query))
      .then(this.rewriteSearchResponse);
  }

  /**
   * Default autocomplete query generator
   */
  getAutocompleteQuery(query) {

    const {
      apiKey,
      baseUrl,
      boundary,
      focusPoint,
      options,
      sources,
      maxResults,
    } = this.geocoderConfig;

		// const latitude = params.lat,
		// 	longitude = params.lon,
		  const	limit = maxResults
			const {maxLat, minLon, minLat, maxLon} = boundary.rect
			const bbox = `${minLon},${minLat},${maxLon},${maxLat}`
			// const lang = params.language // todo: language
			const text = encodeURIComponent(query.text)
      const queryToReturn = '?'
       +`q=${text}`
				+`&apiKey=${apiKey}`
				// +`&lang=${lang}`
				// +'&result_types=address,place'
				+`&in=bbox:${bbox}`
				+`&limit=${limit}`;
    return queryToReturn
    return {
      apiKey,
      boundary,
      focusPoint,
      options,
      query: queryToReturn
    };
  }

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
