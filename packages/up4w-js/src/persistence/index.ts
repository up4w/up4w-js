import RequestManager from "../request-manager";

export interface PersistenceDataReq {
  /*  the 32-byte datakey in base 64 (UEP-20) */
  key: string;
  /* the storage slot of the value (0~255) */
  slot: number;
  /*  TTL in seconds of the value */
  ttl: number;
  /* the value data in base64 */
  value: string;
  /* the AES secret for value encryption, optional. */
  secret?: string;
}

export interface PersistenceData {
  encrypted: boolean;
  modified: number;
  value: string;
}

class Persistence {
  requestManager: RequestManager;

  constructor(manager: RequestManager) {
    // todo
    this.requestManager = manager;
  }

  get provider() {
    return this.requestManager.currentProvider;
  }

  setValue(params: PersistenceDataReq) {
    return this.requestManager.send<PersistenceDataReq, null>({
      req: "netkv.set",
      arg: params,
    });
  }

  getValue(params: Pick<PersistenceDataReq, "key">) {
    return this.requestManager.send<
      Pick<PersistenceDataReq, "key">,
      PersistenceData
    >({
      req: "netkv.get",
      arg: params,
    });
  }
}

export default Persistence;
