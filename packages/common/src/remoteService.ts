import { textUtils } from './utils/index.js';

export class RemoteServiceResponseError extends Error {
  constructor(status: Response['status'], content: string) {
    super(RemoteServiceResponseError.getMessage(status, content));
  }

  protected static getMessage(status: Response['status'], content: string): string {
    return `Response Error [Code: ${status}]. Content = ${content}`;
  }
}

export abstract class RemoteService {
  readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = textUtils.trimSlashes(baseUrl);
  }

  protected getUrl(uri: string) {
    return new URL(this.baseUrl + '/' + textUtils.trimSlashes(uri));
  }

  protected async getRequestInit(requestInit: RequestInit = {}) {
    const headers = new Headers(requestInit.headers);
    if (!headers.has('Accept'))
      headers.append('Accept', 'application/json');
    if (!headers.has('Content-Type'))
      headers.append('Content-Type', 'application/json');

    requestInit.headers = headers;
    return requestInit;
  }

  protected async fetch<T>(uri: string, requestInit?: RequestInit, useDefaultRequestInitFields = true): Promise<T> {
    if (useDefaultRequestInitFields)
      requestInit = await this.getRequestInit(requestInit);
    const url = this.getUrl(uri);
    const response = await fetch(url.href, requestInit);

    await this.ensureResponseOk(response);

    return response.json() as Promise<T>;
  }

  protected async ensureResponseOk(response: Response) {
    if (response.ok)
      return;

    let content: string | undefined;
    try {
      content = await response.text();
    }
    catch {
      content = '[unavailable]';
    }

    throw new RemoteServiceResponseError(response.status, content);
  }
}
