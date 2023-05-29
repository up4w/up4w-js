import { Up4wjsRes } from "up4wjs-providers";
import RequestManager, { SubscriptionItem } from "../request-manager";

export interface Message {
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

interface MessageText {
  swarm?: string;
  recipient: string;
  app: number;
  action: number;
  content: any;
  content_type?: number;
}

export interface ReceivePushParam {
  conversation?: string;
  app?: string;
}

class Msg {
  requestManager: RequestManager;

  constructor(manager: RequestManager) {
    // todo
    this.requestManager = manager;
  }

  get provider() {
    return this.requestManager.currentProvider;
  }

  enableReceivePush(params?: ReceivePushParam) {
    return this.requestManager.send({
      req: "msg.receive_push",
      arg: params || {},
    });
  }

  sendText(params: MessageText) {
    return this.requestManager.send({
      req: "msg.text",
      arg: {
        ...params,
        content_type: 13,
      },
    });
  }

  sendImg() {
    // this.requestManager.send({
    //   req: "msg.receive_push",
    // });
  }

  sendAudio() {}

  onMessage(
    callback = (_: Up4wjsRes<Message>) => {},
    receiveParams?: ReceivePushParam
  ) {
    this.enableReceivePush(receiveParams);
    return this.requestManager.addSubscriptions({
      callback: (err, data) => callback(data!),
      req: "msg.received",
    });
  }

  subscribe(subscription: SubscriptionItem) {
    return this.requestManager.addSubscriptions(subscription);
  }
}

export default Msg;
