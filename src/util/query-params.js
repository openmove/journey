export function addQueryParams(originalUrl,params={}){

    if(!originalUrl){
      return
    }

    const url = new URL(originalUrl)
    const oldParams = Array.from(url.searchParams.entries())
    const newParams = new URLSearchParams([
      ...oldParams,
      ...Object.entries(params),
  ]).toString();

  const newUrl = new URL(`${url.origin}${url.pathname}?${newParams}`);

  return newUrl
}
