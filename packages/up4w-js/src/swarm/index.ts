import RequestManager from "../request-manager";

export interface Up4wjsSwarm {
  /* the 20-byte DHT address of the swarm in base16 */
  address: string;
  /*  the 32-byte private swarm secret in base64, optional. If specified, the swarm will be private swarm */
  secret: string;
  msgs: {
    /* the epoch unit in millisecond for the DAGM (UEP-12) */
    epoch: number;
    /* the max TTL in epoch for the DAGM */
    ttl: number;
    /*  the range of the subband, should be 2^n */
    subband: number;
    /* the maximum size of attached media in messages, unspecified or 0 indicates media
attachment is not allowed */
    media_size: number;
  };

  dvs: {
    /*  the maximum size of values in DVS (UEP-20) */
    value_size: number;
  };
}

class Swarm {
  requestManager: RequestManager;

  constructor(manager: RequestManager) {
    // todo
    this.requestManager = manager;
  }

  get provider() {
    return this.requestManager.currentProvider;
  }

  join(swarm: Up4wjsSwarm) {
    return this.requestManager.send({
      req: "swarm.join",
      arg: swarm,
    });
  }

  leave() {
    return this.requestManager.send<Up4wjsSwarm, null>({
      req: "swarm.leave",
    });
  }
}

export default Swarm;
