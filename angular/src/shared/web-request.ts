export class WebRequestService {
  async fetch(url: string) {
    // Default options are marked with *
    return fetch(url, {
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, *same-origin, omit
      // APPLYING THIS HEADER WILL ACTIVATE PREFLIGHT!
      // headers: {
      //     'Content-Type': 'application/json'
      // },
      redirect: 'follow', // manual, *follow, error
      referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    });
  }

  async fetchWithTimeout(resource: RequestInfo, options: any) {
    const { timeout = 15000 } = options;

    const abortController = new AbortController();
    const id = setTimeout(() => abortController.abort(), timeout);

    const response = fetch(resource, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'same-origin',
      // APPLYING THIS HEADER WILL ACTIVATE PREFLIGHT!
      // headers: {
      //     'Content-Type': 'application/json'
      // },
      redirect: 'follow',
      referrerPolicy: 'no-referrer',
      signal: abortController.signal,
      ...options,
    });
    clearTimeout(id);
    return response;
  }
}
