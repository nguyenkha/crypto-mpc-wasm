import { createBindings } from "./wasm-bindings.js";
import { MPCPeer, Context, MPCNativeError } from "./protocol.js";
export { MPCPeer, Context, MPCNativeError };
export { KeyType, MPCError } from "./types.js";
export function createPeer(wasmModule, peer) {
    const bindings = createBindings(wasmModule);
    return new MPCPeer(wasmModule, bindings, peer);
}
export async function initMPC(loadModule) {
    const m = await loadModule();
    const bindings = createBindings(m);
    return {
        peer1: new MPCPeer(m, bindings, 1),
        peer2: new MPCPeer(m, bindings, 2),
    };
}
//# sourceMappingURL=index.js.map