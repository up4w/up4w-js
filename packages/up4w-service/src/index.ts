import { fork } from "node:child_process";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import EventEmitter from "eventemitter3";
import { UP4WjsError } from "up4wjs-errors";

export interface UP4WJSServerParams {
  debug?: boolean;
  appdata?: string;
}

export interface UP4WJSServerReadyPayload {
  availableEndpoint: { http?: string; ws: string };
}

export type UP4WJSCallabck = (ret: UP4WJSServerReadyPayload) => void;

class UP4WServer extends EventEmitter {
  debug: boolean = false;
  appdata: string = "";
  up4wPort: number | null = null;
  up4wRet: number | null = null;
  abortController: AbortController | null = null;
  whenReady: UP4WJSCallabck = () => {};

  events = {
    READY: "ready",
  };

  constructor(params?: UP4WJSServerParams) {
    params = params || {};
    super();

    const homedir = os.homedir();
    const appdata = path.join(homedir, "up4wjs");

    this.appdata = this.appdata || appdata;
    this.debug = params.debug || false;
  }

  private getResource() {
    let dll: string = "";
    switch (process.platform) {
      case "darwin":
        dll = "up4w.dylib";
        break;
      case "win32":
        dll = "up4w.dll";
        break;
      case "linux":
        dll = "up4w.so";
        break;
      default:
        throw new UP4WjsError("unsupported platform " + process.platform);
    }
    return path.join(__dirname, "../addons", process.platform, dll);
  }

  private createServer = () => {
    // if (!fs.existsSync(this.appdata)) {
    //   throw new UP4WjsError("The appdata dest not exist:" + this.appdata);
    // }
    const controller = new AbortController();
    const { signal } = controller;
    const resource = this.getResource();

    this.abortController = controller;

    if (!fs.existsSync(resource)) {
      throw new Error("File not exist:" + resource);
    }

    const cp = fork(
      path.join(__dirname, "up4w-server.js"),
      [`--resource=${resource}`, `--appdata=${this.appdata}`],
      { signal, stdio: "ignore", detached: true }
    );

    cp.on("message", (v: any) => {
      this.emit("message", v);
      if (v.err) {
        this.emit("error", v.err);
      }
      if (v.port && v.ret === 1) {
        this.up4wPort = v.port;
        this.up4wRet = v.ret;

        const payload: UP4WJSServerReadyPayload = {
          availableEndpoint: {
            http: `http://127.0.0.1:${v.port}/cmd`,
            ws: `ws://127.0.0.1:${v.port}/api`,
          },
        };
        this.emit(this.events.READY, payload);
        this.whenReady(payload);
      }
    });

    // Emit close event when child process closed
    cp.on("close", (code: number) => {
      this.emit("close", code);
    });

    // Emit error event when child process closed
    cp.on("error", (error) => {
      this.emit("error", error);
    });

    process.once("exit", function () {
      cp.kill();
    });

    // Catch ctrl-c
    process.on("SIGINT", () => process.exit());
    // Catch kill
    process.on("SIGTERM", () => process.exit());
  };

  run = (callback?: UP4WJSCallabck) => {
    return new Promise((resolve) => {
      this.whenReady = (data: UP4WJSServerReadyPayload) => {
        resolve(data);
        callback?.(data);
      };
      this.createServer();
    });
  };
}

export default UP4WServer;
