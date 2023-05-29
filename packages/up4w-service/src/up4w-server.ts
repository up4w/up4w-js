import minimist from "minimist";
import koffi from "koffi";

const args = minimist(process.argv.slice(2));
const { resource, appdata } = args;
const sendMessage = (message: any) => {
  if (typeof process.send === "function") {
    process.send(message);
  }
};

const appdataPath = "-appData:" + appdata;

sendMessage({ appdataPath, resource });

try {
  const lib = koffi.load(resource);
  const start = lib.func("start", "int", ["string"]);
  const getPort = lib.func("get_api_port", "int", []);

  const v = start(appdataPath);

  sendMessage({ ret: v });

  const port = getPort();
  sendMessage({ ret: v, port });

  setTimeout(() => {
    // Prevent GC collecting function
    // DO NOT REMOVE IT
    console.log(typeof lib);
  }, 1000 * 3600 * 365);
} catch (ex: any) {
  sendMessage({ err: ex.toString() });
  process.exit(1);
}
