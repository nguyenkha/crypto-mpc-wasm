import type { EmscriptenModule } from "./types.js";
export declare function allocBytes(m: EmscriptenModule, data: Uint8Array): number;
export declare function readBytes(m: EmscriptenModule, ptr: number, len: number): Uint8Array;
export declare function allocPtr(m: EmscriptenModule): number;
export declare function readPtr(m: EmscriptenModule, ptrPtr: number): number;
export declare function allocInt(m: EmscriptenModule, value?: number): number;
export declare function readInt(m: EmscriptenModule, ptr: number): number;
/** Call toBuf pattern: first call with null to get size, then allocate and read */
export declare function readToBuf(m: EmscriptenModule, toBufFn: (ptr: number, outBuf: number, outSize: number) => number, handle: number): Uint8Array;
export declare class MPCNativeError extends Error {
    code: number;
    constructor(code: number);
}
export declare function checkRv(rv: number): void;
//# sourceMappingURL=memory.d.ts.map