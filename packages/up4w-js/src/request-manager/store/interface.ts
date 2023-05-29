export abstract class Store {
  abstract filename: string;
  abstract cache: Map<string, boolean>;
  abstract get: (id: string) => Promise<boolean | null>;
  abstract set: (id: string, value: boolean) => void;
}
