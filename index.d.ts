import { MPCPeer, Context, MPCNativeError } from "./protocol.js";
import type { EmscriptenModule } from "./types.js";
export { MPCPeer, Context, MPCNativeError };
export { KeyType, MPCError } from "./types.js";
export type { ShareInfo, ContextInfo, MessageInfo, BIP32Info, StepResult, EmscriptenModule, } from "./types.js";
export declare function createPeer(wasmModule: EmscriptenModule, peer: 1 | 2): MPCPeer;
export declare function initMPC(loadModule: () => Promise<EmscriptenModule>): Promise<{
    peer1: MPCPeer;
    peer2: MPCPeer;
}>;
//# sourceMappingURL=index.d.ts.map