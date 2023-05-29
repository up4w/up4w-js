import { envs } from "up4wjs-utils";
import { Store } from "./store/interface";
import BrowserStore from "./store/browser";
import FileSystemStore from "./store/fs";

export default class KeyStore {
  store: Store | null;

  constructor() {
    // this.store = new BrowserStore("gpt4w-message");
    if (envs.isBrowser) {
      this.store = new BrowserStore("gpt4w-message");
    } else if (envs.isNodejs) {
      this.store = new FileSystemStore("gpt4w-message.json");
    } else {
      throw new Error("Unknow environment");
    }
  }

  get isBrowser() {
    return envs.isBrowser;
  }

  set(id: string, value: any = true) {
    this.store?.set(id, value);
  }

  get(id: string) {
    return this.store?.get(id);
  }
}
