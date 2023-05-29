import Nedb from "nedb";
import { envs } from "up4wjs-utils";

export default class Keyv {
  nedb: Nedb;
  constructor(filepath: string) {
    this.nedb = new Nedb({
      autoload: true,
      filename: filepath,
    });
  }

  makeFilename() {
    if (envs.isBrowser) {
      return "gpt4w.json";
    } else if (envs.isNodejs) {
      return;
    }
    throw new Error("Unknow environment");
  }

  setValue(messageId: string) {
    return new Promise((resolve, reject) => {
      this.nedb.insert({ messageId, value: true }, (err, doc) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(true);
      });
    });
  }

  getValue(messageId: string) {
    return new Promise((resolve, reject) => {
      this.nedb.findOne({ messageId, value: true }, (err, doc) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(true);
      });
    });
  }
}
