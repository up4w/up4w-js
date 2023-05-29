import { UP4WjsError } from "up4wjs-errors";
import RequestManager from "../request-manager";

export interface NewUser extends Profile {
  pk: string;
}

export interface Profile {
  name?: string;
  gender?: number;
  geolocation?: number;
  greeting_secret?: string;
}

class Contact {
  requestManager: RequestManager;

  constructor(manager: RequestManager) {
    // todo
    this.requestManager = manager;
  }

  get provider() {
    return this.requestManager.currentProvider;
  }

  siginWithSeed(seed: string, profile?: Profile) {
    return this.signin(seed, null, profile);
  }

  siginWithMnemonic(mnemonic: string, profile?: Profile) {
    if (mnemonic.split(" ").length !== 28) {
      throw new UP4WjsError("Invalid mnemonnic format");
    }
    return this.signin(null, mnemonic, profile);
  }

  signin(seed: string | null, mnemonic: string | null, profile: Profile = {}) {
    if (!seed && !mnemonic) {
      return Promise.reject(
        new UP4WjsError(
          "Contact.setProfile: one of `seed` and `mnemonic` is required to be specified"
        )
      );
    }
    const params: any = {};
    if (seed) {
      params.seed = seed;
    }
    if (mnemonic) {
      params.mnemonic = mnemonic;
    }
    return this.requestManager.send({
      req: "social.signin",
      arg: { ...params, profile },
    });
  }

  addUser(user: NewUser) {
    if (!user.pk) {
      return Promise.reject(
        new UP4WjsError("Contact.addUser: user `publickey` is expected")
      );
    }
    return this.requestManager.send({
      req: "social.add_user",
      arg: user,
    });
  }

  removeUser(pk: string) {
    if (!pk) {
      return Promise.reject(
        new UP4WjsError("Contact.removeUser: user `publickey` is expected")
      );
    }
    return this.requestManager.send({
      req: "social.remove_user",
      arg: pk,
    });
  }
}

export default Contact;
