export * as utils from "up4wjs-utils";
export * as errors from "up4wjs-errors";

import { Provider } from "up4wjs-providers";
import Up4wjsCore, { Up4wjsCoreInitReq, Up4wjsCoreStatus } from "./core";
import Contact from "./contact";
import Msg from "./msg";
import Swarm from "./swarm";
import Persistence from "./persistence";
import RequestManager from "./request-manager";

export default class Up4wjs {
  endpoint: string;

  provider: Provider | null;
  contact: Contact;
  swarm: Swarm;
  core: Up4wjsCore;
  msg: Msg;
  requestManager: RequestManager;
  persistence: Persistence;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
    this.requestManager = new RequestManager(endpoint);
    this.provider = this.requestManager.currentProvider;

    this.core = new Up4wjsCore(this.requestManager);
    this.msg = new Msg(this.requestManager);
    this.contact = new Contact(this.requestManager);
    this.swarm = new Swarm(this.requestManager);
    this.persistence = new Persistence(this.requestManager);

    // extend core instance
    // this.extend();
  }

  version() {
    return this.core.version();
  }

  async whenReady(params: Up4wjsCoreInitReq): Promise<boolean> {
    // const init = async () => {
    let status = await this.core.status();
    if (!status.ret.initialized) {
      await this.core.initialize(params);
      // await init();
    }
    status = await this.core.status();
    // };
    // await init();
    return true;
  }

  uninitialize() {
    return this.core.uninitialize();
  }

  shutdown() {
    return this.core.shutdown();
  }

  extend() {
    for (let key of Reflect.ownKeys(this.core)) {
      if (key !== "constructor" && key !== "prototype" && key !== "name") {
        let desc = Object.getOwnPropertyDescriptor(this.core, key);
        if (desc) {
          Object.defineProperty(this, key, desc);
        }
      }
    }
  }
}
