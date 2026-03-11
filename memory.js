export function allocBytes(m, data) {
    const ptr = m._malloc(data.length);
    m.HEAPU8.set(data, ptr);
    return ptr;
}
export function readBytes(m, ptr, len) {
    return new Uint8Array(m.HEAPU8.buffer, ptr, len).slice();
}
export function allocPtr(m) {
    const ptr = m._malloc(4);
    m.setValue(ptr, 0, "i32");
    return ptr;
}
export function readPtr(m, ptrPtr) {
    return m.getValue(ptrPtr, "i32");
}
export function allocInt(m, value = 0) {
    const ptr = m._malloc(4);
    m.setValue(ptr, value, "i32");
    return ptr;
}
export function readInt(m, ptr) {
    return m.getValue(ptr, "i32");
}
/** Call toBuf pattern: first call with null to get size, then allocate and read */
export function readToBuf(m, toBufFn, handle) {
    const sizePtr = allocInt(m);
    try {
        const rv1 = toBufFn(handle, 0, sizePtr);
        if (rv1 !== 0)
            throw new MPCNativeError(rv1);
        const size = readInt(m, sizePtr);
        const buf = m._malloc(size);
        try {
            m.setValue(sizePtr, size, "i32");
            const rv2 = toBufFn(handle, buf, sizePtr);
            if (rv2 !== 0) {
                m._free(buf);
                throw new MPCNativeError(rv2);
            }
            return readBytes(m, buf, readInt(m, sizePtr));
        }
        finally {
            m._free(buf);
        }
    }
    finally {
        m._free(sizePtr);
    }
}
export class MPCNativeError extends Error {
    constructor(code) {
        super(`MPC native error: 0x${code.toString(16)}`);
        this.name = "MPCNativeError";
        this.code = code;
    }
}
export function checkRv(rv) {
    if (rv !== 0)
        throw new MPCNativeError(rv);
}
//# sourceMappingURL=memory.js.map