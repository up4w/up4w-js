import { makeId } from "up4wjs-utils";
import {
  HttpProvider,
  WebsocketProvider,
  Provider,
  Up4wjsReq,
  Up4wjsRes,
} from "up4wjs-providers";
import { UP4WjsError, errors } from "up4wjs-errors";
import KeyStore from "./keyStore";

export type Endpoint = string;
export type RequestManagerParams = Endpoint;
export type SubscribeCallback = (
  err: UP4WjsError | null,
  data?: Up4wjsRes<any>
) => void;
export interface SubscriptionItem {
  callback: SubscribeCallback;
  req: string;
  inc?: string;
}

interface Message {
  swarm: string;
  id: string;
  timestamp: number;
  sender: string;
  app: number;
  recipient: string;
  action: number;
  content: string;
  content_type: number;
  media: string[];
}

export default class RequestManager {
  endpoint: string;
  subscriptions: Map<string, SubscriptionItem[]>;
  keyStore: KeyStore;

  // if the message has been emited
  msgEmited: Map<string, boolean> = new Map();

  static providers = {
    HttpProvider,
    WebsocketProvider,
  };

  private provider: Provider | null = null;

  constructor(endpoint: Endpoint) {
    this.endpoint = endpoint;
    this.subscriptions = new Map();
    this.setProvider(this.endpoint);
    this.keyStore = new KeyStore();
  }

  get currentProvider() {
    return this.provider;
  }

  get canSub() {
    return (
      typeof this.provider?.on === "function" &&
      this.provider.supportsSubscriptions()
    );
  }

  private _isCleanCloseEvent = function (event: any) {
    return (
      typeof event === "object" &&
      ([1000].includes(event.code) || event.wasClean === true)
    );
  };

  private async showDrop(message: Message): Promise<boolean> {
    // const emited = this.msgEmited.get(message.id);
    const emited = await this.keyStore.get(message.id);
    if (emited) {
      return true;
    }
    this.msgEmited.set(message.id, true);
    return false;
  }

  protected setProvider(endpoint: string) {
    let provider: Provider;
    if (!endpoint || typeof endpoint !== "string") {
      throw new UP4WjsError("Provider expect endpoint be string");
    }
    // HTTP
    if (/^http(s)?:\/\//i.test(endpoint)) {
      provider = new RequestManager.providers.HttpProvider(endpoint);
      // WS
    } else if (/^ws(s)?:\/\//i.test(endpoint)) {
      provider = new RequestManager.providers.WebsocketProvider(endpoint);
    } else {
      throw new Error("Can't autodetect provider for \"" + endpoint + '"');
    }
    this.provider = provider || null;

    // reset the old one before changing, if still connected
    if (this.provider && this.provider.connected) {
      this.clearSubscriptions();
    }

    if (this.canSub && typeof this.provider?.on === "function") {
      this.provider.on("data", async (result: Up4wjsRes<Message>) => {
        if (this.subscriptions.has(result.rsp)) {
          const { rsp, ret } = result;
          const subscription = this.subscriptions.get(rsp);
          if (ret) {
            const drop = await this.showDrop(ret);
            if (drop) {
              // console.warn("drop message for duplication ", ret.id, ret);
              return;
            }
            this.keyStore.set(ret.id, true);
            subscription?.forEach(({ callback }) => {
              callback(null, result);
            });
          }
        }
      });

      // notify all subscriptions about the error condition
      this.provider.on("error", (error: UP4WjsError) => {
        this.subscriptions.forEach(function (subscription) {
          subscription?.forEach(({ callback }) => {
            callback(error);
          });
        });
      });

      // notify all subscriptions about bad close conditions
      const disconnect = (event: any) => {
        if (!this._isCleanCloseEvent(event)) {
          this.subscriptions.forEach((subscription, key) => {
            subscription.forEach(({ callback }) =>
              callback(errors.ConnectionCloseError(event))
            );
            this.subscriptions.delete(key);
          });
          if (this.provider && this.provider.emit) {
            this.provider.emit("error", errors.ConnectionCloseError(event));
          }
        }
        if (this.provider && this.provider.emit) {
          this.provider.emit("end", event);
        }
      };
      this.provider.on("disconnect", disconnect);
    }
  }

  send<T, K = any>(params: Up4wjsReq<T>): Promise<Up4wjsRes<K>> {
    return new Promise((resolve, reject) => {
      this.provider?.send(params, (error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve(data as Up4wjsRes<K>);
        }
      });
    });
  }

  clearSubscriptions(req?: string, subscription?: SubscriptionItem): boolean {
    if (!req) {
      this.subscriptions.clear();
      if (this.provider?.reset) {
        this.provider?.reset();
      }
      return true;
    }
    if (subscription) {
      const list = this.subscriptions.get(req);
      const index = list?.findIndex((sub) => subscription === sub);
      if (!list || index === -1 || typeof index === "undefined") {
        return false;
      }
      list.splice(index, 1);
      this.subscriptions.set(req, list);
    }
    return true;
  }

  addSubscriptions(subscription: SubscriptionItem) {
    if (this.provider?.on) {
      subscription.inc = makeId();
      const subItem = this.subscriptions.get(subscription.req) || [];
      // subItem.push(subscription);
      subItem[0] = subscription;
      this.subscriptions.set(subscription.req, subItem);
    } else {
      throw new UP4WjsError(
        "The provider doesn't support subscriptions: " +
          this.provider!.constructor.name
      );
    }
    return () => this.clearSubscriptions(subscription.req, subscription);
  }

  batchSend() {}
}
