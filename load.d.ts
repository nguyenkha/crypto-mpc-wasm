import { MPCPeer } from "./index.js";
import type { EmscriptenModule } from "./types.js";

export declare function load(wasmUrl?: string): Promise<{
  module: EmscriptenModule;
  createPeer: (peer: 1 | 2) => MPCPeer;
  peer1: MPCPeer;
  peer2: MPCPeer;
}>;
