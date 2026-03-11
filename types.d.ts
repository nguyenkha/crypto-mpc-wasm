export declare const MPC_PROTOCOL_FINISHED = 1;
export declare const MPC_SHARE_CHANGED = 2;
export declare enum KeyType {
    EdDSA = 2,
    ECDSA = 3,
    GenericSecret = 4
}
export declare enum MPCError {
    BadArg = 4278255618,
    Format = 4278255619,
    TooSmall = 4278255624,
    Crypto = 4278452225
}
export interface ShareInfo {
    uid: bigint;
    type: KeyType;
}
export interface ContextInfo {
    uid: bigint;
    shareUid: bigint;
    peer: number;
}
export interface MessageInfo {
    contextUid: bigint;
    shareUid: bigint;
    srcPeer: number;
    dstPeer: number;
}
export interface BIP32Info {
    hardened: boolean;
    level: number;
    childNumber: number;
    parentFingerprint: number;
    chainCode: Uint8Array;
}
export interface StepResult {
    finished: boolean;
    shareChanged: boolean;
    message: Uint8Array | null;
}
export interface EmscriptenModule {
    cwrap: (name: string, returnType: string | null, argTypes: string[]) => (...args: unknown[]) => unknown;
    _malloc: (size: number) => number;
    _free: (ptr: number) => void;
    getValue: (ptr: number, type: string) => number;
    setValue: (ptr: number, value: number, type: string) => void;
    HEAPU8: Uint8Array;
}
//# sourceMappingURL=types.d.ts.map