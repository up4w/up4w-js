const UP4WJS = require("up4w-js");
const UP4WService = require("up4w-service");

const service = new UP4WService();

// The public key of message receiver
const TARGET_PK = "<a_base64_public_key>";

// Make sure to replace your seed here
const YOUR_SEED = "<a_base64_seed_string>";

service.run().then(async (r) => {
  const {
    availableEndpoint: { ws },
  } = r;
  const up4w = new UP4WJS(ws);
  await up4w.whenReady({
    app_name: "deso",
    mrc: {
      msgs_dir: ":mem",
      default_swarm: "<a_base64_swarm_address>", // replace it with your default swarm address
      flags: ["delay00_load"],
    },
    mlt: {},
    gdp: {},
    pbc: {},
    lsm: {},
  });

  // Get UP4W build versioin
  up4w.version().then((r) => {
    console.log("UP4W Version => ", r.ret);
  });

  await up4w.contact.signin(YOUR_SEED, null, {
    name: "Lufi",
  });

  await up4w.contact.addUser({
    pk: TARGET_PK,
  });

  up4w.msg.onMessage((message) => {
    console.log("received message: ", message);
  });

  await up4w.msg.sendText({
    recipient: TARGET_PK,
    app: 1,
    action: 4096,
    content: "300 / 2 = ?",
  });
});
