import { Store } from "./interface";
import type Keyv from "keyv";

export default class FileSystemStore implements Store {
  filename: string;
  cache: Map<string, boolean> = new Map();
  savePath: string;

  fs = require("fs");
  keyv = require("keyv");
  store: Keyv;

  constructor(filename: string) {
    const path = require("path");
    const tempdir = require("os").tmpdir();
    const KeyvFile = require("keyv-file").KeyvFile;

    this.savePath = path.join(tempdir, "keyv-file", filename);
    this.filename = filename;

    this.store = new this.keyv({
      store: new KeyvFile({
        filename: this.savePath, // the file path to store the data
        expiredCheckDelay: 24 * 3600 * 1000, // ms, check and remove expired data in each ms
        writeDelay: 100, // ms, batch write to disk in a specific duration, enhance write performance.
        encode: JSON.stringify, // serialize function
        decode: JSON.parse, // deserialize function
      }),
    });
  }

  async get(id: string) {
    const value = this.cache.get(id);
    if (value) {
      return value;
    }
    const v = await this.store.get(id);
    return v;
  }

  set(id: string, value: boolean) {
    this.cache.set(id, value);
    this.store.set(id, value);
  }
}
