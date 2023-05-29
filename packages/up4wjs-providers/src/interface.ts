import { UP4WjsError } from "up4wjs-errors";

export interface Up4wjsReq<T = any> {
  req: string;
  arg?: T;
  /* invocation nonce, only for asynchronous request */
  inc?: string;
}

export interface Up4wjsRes<T = any> {
  rsp: string;
  ret: T;
  inc?: string;
  fin?: boolean;
  err?: number | string;
}

export abstract class Provider {
  abstract send: <T, K>(
    payload: Up4wjsReq<T>,
    callback: (error: UP4WjsError | null, data?: Up4wjsRes<K>) => void
  ) => void;

  abstract connected?: boolean;

  abstract supportsSubscriptions: () => boolean;

  abstract on?: (event: string, payload: any) => void;
  abstract emit?: (event: string, payload: any) => void;
  abstract reset?: () => void;
}

// export type ProviderType = typeof instanceof Provider;
