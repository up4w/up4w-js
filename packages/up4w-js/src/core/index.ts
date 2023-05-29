import { Provider } from "up4wjs-providers";
import type RequestManager from "../request-manager";

interface KeyValue<T = any> {
  [props: string]: T;
}

export interface Up4wjsCoreStatus {
  dht_nodes: number[];
  initialized: boolean;
  internet: string;
  modules: string[];
  net_time: [number, number, boolean, boolean];
  swarms: { [k: string]: string };
}

export interface Up4wjsCoreInitReq {
  // the name of the application, instances with different `app_name` will not discover each other in nearby peers (UEP-8)
  app_name: string;
  // initialize message relay core (UEP-12), `msgs_dir` specifies the storage directory for saving pooled messages, or
  // its value can be `:mem` to just memory for temporary storage.
  mrc: {
    msgs_dir?: string;
    // specifies storage directory for saving offload media,
    // if specified, the distributed media store (UEP-16) will be initialized as well.
    media_dir?: string;
    default_swarm?: string;
    flags?: string[];
  };
  // initialize distributed key-value store (UEP-20) with `kv_dir` specifies the storage directory, or memory.
  dvs?: {
    kv_dir: string;
    flags: string[];
  };
  // enable packet obfuscation (UEP-6).
  hob?: KeyValue;
  // initialize nearby peers module (UEP-8).
  lsm?: KeyValue;
  // enable multi-link tunnels (UEP-??).
  mlt: KeyValue;
  // initialize gossip data protocol (UEP-11), it will be automatically initialized if `mrc` or `dvs` is specified.
  gdp: KeyValue;
  // enable packet bouncer (UEP-??).
  pbc: KeyValue;
}

export default class Up4wjsCore {
  requestManager: RequestManager;

  constructor(manager: RequestManager) {
    this.requestManager = manager;
  }

  get provider() {
    return this.requestManager.currentProvider;
  }

  version = () => {
    return this.requestManager.send<null, string>({
      req: "core.ver",
    });
  };

  initialize = (params: Up4wjsCoreInitReq) => {
    return this.requestManager.send<Up4wjsCoreInitReq, KeyValue<boolean>>({
      req: "core.init",
      arg: params,
    });
  };

  uninitialize = () => {
    return this.requestManager.send({
      req: "core.term",
    });
  };

  shutdown = () => {
    return this.requestManager.send({
      req: "core.shutdown",
    });
  };

  loadDelayed = () => {
    return this.requestManager.send<null, { mod1: boolean }>({
      req: "core.shutdown",
    });
  };

  status = () => {
    return this.requestManager.send<null, Up4wjsCoreStatus>({
      req: "core.status",
    });
  };
}
