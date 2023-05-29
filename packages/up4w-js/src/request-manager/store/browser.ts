import { Store } from "./interface";

// export default class BroswerStore implements Store {
//   filename: string;
//   cache: Map<string, boolean> = new Map();

//   constructor(filename: string) {
//     this.filename = filename;
//     this.cache = this.load();
//   }

//   load() {
//     const all = localStorage.getItem(this.filename);
//     const ret = new Map();
//     if (all) {
//       const data: string[] = JSON.parse(all) || [];
//       return data.reduce<Map<string, boolean>>((prev, id: string) => {
//         prev.set(id, true);
//         return prev;
//       }, ret);
//     }
//     return ret;
//   }

//   serialize() {
//     return this.cache.keys();
//   }

//   get(id: string) {
//     return Promise.resolve(this.cache.get(id) || null);
//   }

//   set(id: string, value: boolean) {
//     this.cache.set(id, value);
//     localStorage.setItem(this.filename, JSON.stringify([...this.serialize()]));
//   }
// }
import localforage from "localforage";
export default class BroswerStore implements Store {
  filename: string;
  cache: Map<string, boolean> = new Map();

  constructor(filename: string) {
    this.filename = filename;
    this.cache = this.load();
  }

  load() {
    const all = localStorage.getItem(this.filename);
    const ret = new Map();
    if (all) {
      const data: string[] = JSON.parse(all) || [];
      return data.reduce<Map<string, boolean>>((prev, id: string) => {
        prev.set(id, true);
        return prev;
      }, ret);
    }
    return ret;
  }

  serialize() {
    return this.cache.keys();
  }

  get(id: string) {
    return Promise.resolve(this.cache.get(id) || null);
  }

  set(id: string, value: boolean) {
    this.cache.set(id, value);
    localStorage.setItem(this.filename, JSON.stringify([...this.serialize()]));
  }
}
