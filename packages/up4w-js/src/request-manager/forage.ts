/**
 * Way data is stored for this database
 * For a Node.js/Node Webkit database it's the file system
 * For a browser-side database it's localforage, which uses the best backend available (IndexedDB then WebSQL then localStorage)
 *
 * This version is the browser version
 */

import localforage from "localforage";

export default class Forage {
  constructor() {
    localforage.config({
      name: "UP4W_DB",
      storeName: "UP4W",
    });
  }

  getValue(key: string) {
    return localforage.getItem(key);
  }

  setValue(key: string, value: any) {
    return localforage.setItem(key, value);
  }
}
