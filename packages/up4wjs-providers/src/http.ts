import { errors } from "up4wjs-errors";
import fetch from "cross-fetch";

import { Provider } from "./interface";

type ExtendOptions = RequestInit & {
  timeout: number;
};

export class HttpProvider implements Provider {
  host: string;
  options?: ExtendOptions;
  timeout: number;
  timeoutId?: NodeJS.Timeout;
  controller?: AbortController;

  constructor(host: string, options?: ExtendOptions) {
    this.host = host;
    this.options = options;
    this.timeout = options?.timeout || 30 * 1000;
  }

  send = (payload: any) => {
    let controller: AbortController | undefined = undefined;

    const options: RequestInit = Object.assign(
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      this.options || {}
    );

    if (typeof AbortController !== "undefined") {
      this.controller = controller = new AbortController();
    } else if (
      typeof window !== "undefined" &&
      typeof window.AbortController !== "undefined"
    ) {
      // Some chrome version doesn't recognize new AbortController(); so we are using it from window instead
      // https://stackoverflow.com/questions/55718778/why-abortcontroller-is-not-defined
      this.controller = controller = new window.AbortController();
    }

    if (typeof controller !== "undefined") {
      options.signal = controller.signal;
    }

    if (this.timeout > 0 && typeof controller !== "undefined") {
      this.timeoutId = setTimeout(function () {
        controller!.abort();
      }, this.timeout);
    }

    return fetch(this.host, options as any).then(this.onSuccess, this.onFailed);
  };

  private onFailed = (error: any) => {
    if (this.timeoutId !== undefined) {
      clearTimeout(this.timeoutId);
    }

    if (error.name === "AbortError") {
      return errors.ConnectionTimeout(this.timeout);
    }
    return errors.InvalidConnection(this.host);
  };

  private onSuccess = (response: any) => {
    if (this.timeoutId !== undefined) {
      clearTimeout(this.timeoutId);
    }

    // Response is a stream data so should be awaited for json response
    response
      .json()
      .then((data: any) => data)
      .catch(function () {
        errors.InvalidResponse(response);
      });
  };

  disconnect = () => {
    this.controller && this.controller.abort();
  };

  supportsSubscriptions() {
    return false;
  }
}
