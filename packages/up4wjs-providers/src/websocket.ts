import EventEmitter from "eventemitter3";
import qs from "qs";
// import base64 from "js-base64";
import { errors, UP4WjsError } from "up4wjs-errors";
import { makeId } from "up4wjs-utils";

// https://www.npmjs.com/package/websocket
import { w3cwebsocket as Ws } from "websocket";

import { Provider, Up4wjsReq, Up4wjsRes } from "./interface";

export interface RequestItem<T = any, K = any> {
  payload: Up4wjsReq<T>;
  callback: (error: UP4WjsError | null, data?: Up4wjsRes<K>) => void;
}

interface Reconnect {
  auto: boolean;
  delay: number;
  onTimeout: boolean;
  maxAttempts?: number;
}

type KeyValue = {
  [key: string]: string | number;
};

interface ProviderOptions {
  timeout?: number;
  headers?: { [key: string]: any };
  protocol?: string;
  reconnect?: Reconnect;
  clientConfig?: any;
  requestOptions?: any;
}

class WebsocketProvider extends EventEmitter implements Provider {
  url = "";
  DATA = "data";
  CLOSE = "close";
  ERROR = "error";
  CONNECT = "connect";
  RECONNECT = "reconnect";

  private _customTimeout = 0;
  private headers: KeyValue = {};
  private protocol: string | undefined = "";
  private reconnectOptions: Reconnect;
  private clientConfig: any;
  private requestOptions: any;
  private lastChunk: string | null = null;
  private lastChunkTimeout: any;

  protected connection: any;
  protected requestQueue: Map<number | string, RequestItem>;
  protected responseQueue: Map<number | string, RequestItem>;
  protected reconnectAttempts: number;
  protected reconnecting: boolean;

  constructor(url: string, options: ProviderOptions = {}) {
    super();
    this.url = url;
    this._customTimeout = options.timeout || 1000 * 15;
    this.headers = options.headers || {};
    this.protocol = options.protocol || undefined;
    this.reconnectOptions = Object.assign(
      {
        auto: false,
        delay: 5000,
        maxAttempts: false,
        onTimeout: false,
      },
      options.reconnect
    );

    // Allow a custom client configuration
    this.clientConfig = options.clientConfig || undefined;
    // Allow a custom request options (https://github.com/theturtle32/WebSocket-Node/blob/master/docs/WebSocketClient.md#connectrequesturl-requestedprotocols-origin-headers-requestoptions)
    this.requestOptions = options.requestOptions || undefined;

    this.connection = null;
    this.requestQueue = new Map();
    this.responseQueue = new Map();
    this.reconnectAttempts = 0;
    this.reconnecting = false;

    // The w3cwebsocket implementation does not support Basic Auth
    // username/password in the URL. So generate the basic auth header, and
    // pass through with any additional headers supplied in constructor
    const parsedURL = qs.parse(url);
    // if (parsedURL.username && parsedURL.password) {
    //   this.headers.authorization =
    //     "Basic " + base64.encode(parsedURL.username + ":" + parsedURL.password);
    // }

    // When all node core implementations that do not have the
    // WHATWG compatible URL parser go out of service this line can be removed.
    // if (parsedURL.auth) {
    //   this.headers.authorization =
    //     "Basic " + base64.encode(parsedURL.auth.toString());
    // }

    this.connect();
  }

  // make property `connected` which will return the current connection status
  get connected() {
    return (
      this.connection && this.connection.readyState === this.connection.OPEN
    );
  }

  connect = () => {
    this.connection = new Ws(
      this.url,
      this.protocol,
      undefined,
      this.headers,
      this.requestOptions,
      this.clientConfig
    );
    this._addSocketListeners();
  };

  private _addSocketListeners() {
    this.connection.addEventListener("message", this._onMessage);
    this.connection.addEventListener("open", this._onConnect);
    this.connection.addEventListener("close", this._onClose);
  }
  private _removeSocketListeners() {
    this.connection.removeEventListener("message", this._onMessage);
    this.connection.removeEventListener("open", this._onConnect);
    this.connection.removeEventListener("close", this._onClose);
  }

  private _onMessage = (e: any) => {
    this._parseResponse(typeof e.data === "string" ? e.data : "").forEach(
      (result: Up4wjsRes<any>) => {
        // console.log("websocket build-in message event got:", result);
        this.emit(this.DATA, result);
        let inc = result.inc as string;
        // get the id which matches the returned id
        if (Array.isArray(result)) {
          inc = result[0].inc;
        }
        if (!inc && result.rsp !== "msg.received") {
          console.error("inc is unset, is this a bug?", result);
        }
        if (inc && this.responseQueue.has(inc)) {
          const request = this.responseQueue?.get(inc);
          if (request?.callback) {
            request?.callback(null, result);
          }
          const { fin } = result;
          if (typeof fin === "undefined" || fin === true) {
            this.responseQueue.delete(inc);
          }
        }
      }
    );
  };

  private _parseResponse = (data: any) => {
    const returnValues: any[] = [];
    const me = this;
    // DE-CHUNKER
    const dechunkedData = data
      .replace(/\}[\n\r]?\{/g, "}|--|{") // }{
      .replace(/\}\][\n\r]?\[\{/g, "}]|--|[{") // }][{
      .replace(/\}[\n\r]?\[\{/g, "}|--|[{") // }[{
      .replace(/\}\][\n\r]?\{/g, "}]|--|{") // }]{
      .split("|--|");

    dechunkedData.forEach((data: any) => {
      // prepend the last chunk
      if (me.lastChunk) {
        data = me.lastChunk + data;
      }

      let result = null;

      try {
        result = JSON.parse(data);
      } catch (e) {
        me.lastChunk = data;

        // start timeout to cancel all requests
        me.lastChunkTimeout && clearTimeout(me.lastChunkTimeout);
        me.lastChunkTimeout = setTimeout(function () {
          if (me.reconnectOptions.auto && me.reconnectOptions.onTimeout) {
            me.reconnect();

            return;
          }

          me.emit(me.ERROR, errors.ConnectionTimeout(me._customTimeout));

          if (me.requestQueue.size > 0) {
            me.requestQueue.forEach(function (request, key) {
              request.callback(errors.ConnectionTimeout(me._customTimeout));
              me.requestQueue.delete(key);
            });
          }
        }, me._customTimeout);

        return;
      }

      // cancel timeout and set chunk to null
      clearTimeout(me.lastChunkTimeout);
      me.lastChunk = null;

      if (result) {
        returnValues.push(result);
      }
    });

    return returnValues;
  };

  private _onConnect = () => {
    this.emit(this.CONNECT);
    this.reconnectAttempts = 0;
    this.reconnecting = false;

    if (this.requestQueue.size > 0) {
      this.requestQueue.forEach((request, key) => {
        this.send(request.payload, request.callback);
        this.requestQueue.delete(key);
      });
    }
  };

  private _onClose = (event: any) => {
    const me = this;
    if (
      this.reconnectOptions.auto &&
      (![1000, 1001].includes(event.code) || event.wasClean === false)
    ) {
      this.reconnect();
      return;
    }

    this.emit(this.CLOSE, event);

    if (this.requestQueue.size > 0) {
      this.requestQueue.forEach(function (request, key) {
        request.callback(errors.ConnectionNotOpenError(event));
        me.requestQueue.delete(key);
      });
    }

    if (this.responseQueue.size > 0) {
      this.responseQueue.forEach(function (request, key) {
        request.callback(errors.InvalidConnection("on WS", event));
        me.responseQueue.delete(key);
      });
    }

    this._removeSocketListeners();
    this.removeAllListeners();
  };

  send = <T = any, K = any>(
    payload: Up4wjsReq<T>,
    callback: (error: UP4WjsError | null, data?: Up4wjsRes<K>) => void
  ) => {
    const me = this;
    const request = { payload, callback };
    const inc = payload.inc || makeId();
    payload.inc = inc;
    // console.log("send", inc, payload);
    if (
      this.connection.readyState === this.connection.CONNECTING ||
      this.reconnecting
    ) {
      this.requestQueue.set(inc, request);
      return;
    }

    if (this.connection.readyState !== this.connection.OPEN) {
      this.requestQueue.delete(inc);

      this.emit(this.ERROR, errors.ConnectionNotOpenError());
      request.callback(errors.ConnectionNotOpenError());

      return;
    }

    this.responseQueue.set(inc, request);
    this.requestQueue.delete(inc);

    try {
      this.connection.send(JSON.stringify(request.payload));
    } catch (error: any) {
      request.callback(error);
      me.responseQueue.delete(inc);
    }
  };

  reset() {
    this.responseQueue.clear();
    this.requestQueue.clear();

    this.removeAllListeners();
    this._removeSocketListeners();
    this._addSocketListeners();
  }

  /**
   * Removes the listeners and reconnects to the socket.
   * @method reconnect
   * @returns {void}
   */
  reconnect = () => {
    this.reconnecting = true;

    if (this.responseQueue.size > 0) {
      this.responseQueue.forEach((request, key) => {
        try {
          this.responseQueue.delete(key);
          request.callback(errors.PendingRequestsOnReconnectingError());
        } catch (e) {
          console.error("Error encountered in reconnect: ", e);
        }
      });
    }

    if (
      !this.reconnectOptions.maxAttempts ||
      this.reconnectAttempts < this.reconnectOptions.maxAttempts
    ) {
      setTimeout(() => {
        this.reconnectAttempts++;
        this._removeSocketListeners();
        this.emit(this.RECONNECT, this.reconnectAttempts);
        this.connect();
      }, this.reconnectOptions.delay);

      return;
    }

    this.emit(this.ERROR, errors.MaxAttemptsReachedOnReconnectingError());
    this.reconnecting = false;

    if (this.requestQueue.size > 0) {
      this.requestQueue.forEach((request, key) => {
        request.callback(errors.MaxAttemptsReachedOnReconnectingError());
        this.requestQueue.delete(key);
      });
    }
  };

  disconnect(code: number, reason: string) {
    this._removeSocketListeners();
    this.connection.close(code || 1000, reason);
  }

  supportsSubscriptions() {
    return true;
  }
}

export { WebsocketProvider };
