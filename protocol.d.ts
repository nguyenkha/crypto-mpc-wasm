import type { WasmBindings } from "./wasm-bindings.js";
import type { EmscriptenModule, StepResult, ShareInfo, BIP32Info } from "./types.js";
import { MPCNativeError } from "./memory.js";
export declare class Context {
    private ptr;
    private m;
    private b;
    constructor(m: EmscriptenModule, b: WasmBindings, ptr: number);
    step(inMessage: Uint8Array | null): StepResult;
    getShare(): Uint8Array;
    serialize(): Uint8Array;
    free(): void;
}
export declare class MPCPeer {
    private m;
    private b;
    readonly peer: number;
    constructor(m: EmscriptenModule, b: WasmBindings, peer: 1 | 2);
    generateEddsaKey(): Context;
    generateEcdsaKey(): Context;
    generateGenericSecret(bits: number): Context;
    importGenericSecret(key: Uint8Array): Context;
    signEddsa(share: Uint8Array, data: Uint8Array, refresh?: boolean): Context;
    signEcdsa(share: Uint8Array, data: Uint8Array, refresh?: boolean): Context;
    deriveBIP32(share: Uint8Array, hardened: boolean, index: number): Context;
    refreshKey(share: Uint8Array): Context;
    backupEddsaKey(share: Uint8Array, pubBackupKey: Uint8Array): Context;
    backupEcdsaKey(share: Uint8Array, pubBackupKey: Uint8Array): Context;
    getEddsaSignResult(ctx: Context): Uint8Array;
    getEcdsaSignResult(ctx: Context): Uint8Array;
    getDeriveBIP32Result(ctx: Context): Uint8Array;
    getBackupEddsaResult(ctx: Context): Uint8Array;
    getBackupEcdsaResult(ctx: Context): Uint8Array;
    getEddsaPublic(share: Uint8Array): Uint8Array;
    getEcdsaPublic(share: Uint8Array): Uint8Array;
    verifyEddsa(pubKey: Uint8Array, data: Uint8Array, signature: Uint8Array): boolean;
    verifyEcdsa(pubKey: Uint8Array, data: Uint8Array, signature: Uint8Array): boolean;
    getShareInfo(share: Uint8Array): ShareInfo;
    getBIP32Info(share: Uint8Array): BIP32Info;
    serializePubBIP32(share: Uint8Array): string;
    reconstructEcdsaKey(share1: Uint8Array, share2: Uint8Array): Uint8Array;
    static runProtocol(ctx1: Context, ctx2: Context): void;
    private deserializeSharePtr;
}
export { MPCNativeError };
//# sourceMappingURL=protocol.d.ts.map