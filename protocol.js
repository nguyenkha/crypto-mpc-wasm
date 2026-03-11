import { MPC_PROTOCOL_FINISHED, MPC_SHARE_CHANGED, } from "./types.js";
import { allocBytes, readBytes, allocPtr, readPtr, allocInt, readInt, readToBuf, checkRv, MPCNativeError, } from "./memory.js";
export class Context {
    constructor(m, b, ptr) {
        this.m = m;
        this.b = b;
        this.ptr = ptr;
    }
    step(inMessage) {
        let inMsgPtr = 0;
        const outMsgPtrPtr = allocPtr(this.m);
        const flagsPtr = allocInt(this.m);
        try {
            if (inMessage) {
                const inBufPtr = allocBytes(this.m, inMessage);
                const msgPtrPtr = allocPtr(this.m);
                try {
                    checkRv(this.b.messageFromBuf(inBufPtr, inMessage.length, msgPtrPtr));
                    inMsgPtr = readPtr(this.m, msgPtrPtr);
                }
                finally {
                    this.m._free(inBufPtr);
                    this.m._free(msgPtrPtr);
                }
            }
            checkRv(this.b.step(this.ptr, inMsgPtr, outMsgPtrPtr, flagsPtr));
            if (inMsgPtr)
                this.b.freeMessage(inMsgPtr);
            const flags = readInt(this.m, flagsPtr);
            const outMsgPtr = readPtr(this.m, outMsgPtrPtr);
            let message = null;
            if (outMsgPtr) {
                message = readToBuf(this.m, this.b.messageToBuf, outMsgPtr);
                this.b.freeMessage(outMsgPtr);
            }
            return {
                finished: (flags & MPC_PROTOCOL_FINISHED) !== 0,
                shareChanged: (flags & MPC_SHARE_CHANGED) !== 0,
                message,
            };
        }
        finally {
            this.m._free(outMsgPtrPtr);
            this.m._free(flagsPtr);
        }
    }
    getShare() {
        const sharePtrPtr = allocPtr(this.m);
        try {
            checkRv(this.b.getShare(this.ptr, sharePtrPtr));
            const sharePtr = readPtr(this.m, sharePtrPtr);
            const buf = readToBuf(this.m, this.b.shareToBuf, sharePtr);
            this.b.freeShare(sharePtr);
            return buf;
        }
        finally {
            this.m._free(sharePtrPtr);
        }
    }
    serialize() {
        return readToBuf(this.m, this.b.contextToBuf, this.ptr);
    }
    free() {
        if (this.ptr) {
            this.b.freeContext(this.ptr);
            this.ptr = 0;
        }
    }
}
export class MPCPeer {
    constructor(m, b, peer) {
        this.m = m;
        this.b = b;
        this.peer = peer;
    }
    // --- Key generation ---
    generateEddsaKey() {
        const ctxPtrPtr = allocPtr(this.m);
        try {
            checkRv(this.b.initGenerateEddsaKey(this.peer, ctxPtrPtr));
            return new Context(this.m, this.b, readPtr(this.m, ctxPtrPtr));
        }
        finally {
            this.m._free(ctxPtrPtr);
        }
    }
    generateEcdsaKey() {
        const ctxPtrPtr = allocPtr(this.m);
        try {
            checkRv(this.b.initGenerateEcdsaKey(this.peer, ctxPtrPtr));
            return new Context(this.m, this.b, readPtr(this.m, ctxPtrPtr));
        }
        finally {
            this.m._free(ctxPtrPtr);
        }
    }
    generateGenericSecret(bits) {
        const ctxPtrPtr = allocPtr(this.m);
        try {
            checkRv(this.b.initGenerateGenericSecret(this.peer, bits, ctxPtrPtr));
            return new Context(this.m, this.b, readPtr(this.m, ctxPtrPtr));
        }
        finally {
            this.m._free(ctxPtrPtr);
        }
    }
    importGenericSecret(key) {
        const ctxPtrPtr = allocPtr(this.m);
        const keyPtr = allocBytes(this.m, key);
        try {
            checkRv(this.b.initImportGenericSecret(this.peer, keyPtr, key.length, ctxPtrPtr));
            return new Context(this.m, this.b, readPtr(this.m, ctxPtrPtr));
        }
        finally {
            this.m._free(keyPtr);
            this.m._free(ctxPtrPtr);
        }
    }
    // --- Signing ---
    signEddsa(share, data, refresh = false) {
        const sharePtr = this.deserializeSharePtr(share);
        const dataPtr = allocBytes(this.m, data);
        const ctxPtrPtr = allocPtr(this.m);
        try {
            checkRv(this.b.initEddsaSign(this.peer, sharePtr, dataPtr, data.length, refresh ? 1 : 0, ctxPtrPtr));
            return new Context(this.m, this.b, readPtr(this.m, ctxPtrPtr));
        }
        finally {
            this.m._free(dataPtr);
            this.m._free(ctxPtrPtr);
            this.b.freeShare(sharePtr);
        }
    }
    signEcdsa(share, data, refresh = false) {
        const sharePtr = this.deserializeSharePtr(share);
        const dataPtr = allocBytes(this.m, data);
        const ctxPtrPtr = allocPtr(this.m);
        try {
            checkRv(this.b.initEcdsaSign(this.peer, sharePtr, dataPtr, data.length, refresh ? 1 : 0, ctxPtrPtr));
            return new Context(this.m, this.b, readPtr(this.m, ctxPtrPtr));
        }
        finally {
            this.m._free(dataPtr);
            this.m._free(ctxPtrPtr);
            this.b.freeShare(sharePtr);
        }
    }
    // --- BIP32 ---
    deriveBIP32(share, hardened, index) {
        const sharePtr = this.deserializeSharePtr(share);
        const ctxPtrPtr = allocPtr(this.m);
        try {
            checkRv(this.b.initDeriveBIP32(this.peer, sharePtr, hardened ? 1 : 0, index, ctxPtrPtr));
            return new Context(this.m, this.b, readPtr(this.m, ctxPtrPtr));
        }
        finally {
            this.b.freeShare(sharePtr);
            this.m._free(ctxPtrPtr);
        }
    }
    // --- Key refresh ---
    refreshKey(share) {
        const sharePtr = this.deserializeSharePtr(share);
        const ctxPtrPtr = allocPtr(this.m);
        try {
            checkRv(this.b.initRefreshKey(this.peer, sharePtr, ctxPtrPtr));
            return new Context(this.m, this.b, readPtr(this.m, ctxPtrPtr));
        }
        finally {
            this.b.freeShare(sharePtr);
            this.m._free(ctxPtrPtr);
        }
    }
    // --- Backup ---
    backupEddsaKey(share, pubBackupKey) {
        const sharePtr = this.deserializeSharePtr(share);
        const keyPtr = allocBytes(this.m, pubBackupKey);
        const ctxPtrPtr = allocPtr(this.m);
        try {
            checkRv(this.b.initBackupEddsaKey(this.peer, sharePtr, keyPtr, pubBackupKey.length, ctxPtrPtr));
            return new Context(this.m, this.b, readPtr(this.m, ctxPtrPtr));
        }
        finally {
            this.b.freeShare(sharePtr);
            this.m._free(keyPtr);
            this.m._free(ctxPtrPtr);
        }
    }
    backupEcdsaKey(share, pubBackupKey) {
        const sharePtr = this.deserializeSharePtr(share);
        const keyPtr = allocBytes(this.m, pubBackupKey);
        const ctxPtrPtr = allocPtr(this.m);
        try {
            checkRv(this.b.initBackupEcdsaKey(this.peer, sharePtr, keyPtr, pubBackupKey.length, ctxPtrPtr));
            return new Context(this.m, this.b, readPtr(this.m, ctxPtrPtr));
        }
        finally {
            this.b.freeShare(sharePtr);
            this.m._free(keyPtr);
            this.m._free(ctxPtrPtr);
        }
    }
    // --- Result extraction ---
    getEddsaSignResult(ctx) {
        const sigPtr = this.m._malloc(64);
        try {
            checkRv(this.b.getResultEddsaSign(ctx["ptr"], sigPtr));
            return readBytes(this.m, sigPtr, 64);
        }
        finally {
            this.m._free(sigPtr);
        }
    }
    getEcdsaSignResult(ctx) {
        const sigPtr = this.m._malloc(256);
        const sizePtr = allocInt(this.m, 256);
        try {
            checkRv(this.b.getResultEcdsaSign(ctx["ptr"], sigPtr, sizePtr));
            return readBytes(this.m, sigPtr, readInt(this.m, sizePtr));
        }
        finally {
            this.m._free(sigPtr);
            this.m._free(sizePtr);
        }
    }
    getDeriveBIP32Result(ctx) {
        const sharePtrPtr = allocPtr(this.m);
        try {
            checkRv(this.b.getResultDeriveBIP32(ctx["ptr"], sharePtrPtr));
            const sharePtr = readPtr(this.m, sharePtrPtr);
            const buf = readToBuf(this.m, this.b.shareToBuf, sharePtr);
            this.b.freeShare(sharePtr);
            return buf;
        }
        finally {
            this.m._free(sharePtrPtr);
        }
    }
    getBackupEddsaResult(ctx) {
        return readToBuf(this.m, (ptr, out, outSize) => this.b.getResultBackupEddsaKey(ptr, out, outSize), ctx["ptr"]);
    }
    getBackupEcdsaResult(ctx) {
        return readToBuf(this.m, (ptr, out, outSize) => this.b.getResultBackupEcdsaKey(ptr, out, outSize), ctx["ptr"]);
    }
    // --- Public key extraction ---
    getEddsaPublic(share) {
        const sharePtr = this.deserializeSharePtr(share);
        const pubKeyPtr = this.m._malloc(32);
        try {
            checkRv(this.b.getEddsaPublic(sharePtr, pubKeyPtr));
            return readBytes(this.m, pubKeyPtr, 32);
        }
        finally {
            this.m._free(pubKeyPtr);
            this.b.freeShare(sharePtr);
        }
    }
    getEcdsaPublic(share) {
        const sharePtr = this.deserializeSharePtr(share);
        const pubKeyPtr = this.m._malloc(256);
        const sizePtr = allocInt(this.m, 256);
        try {
            checkRv(this.b.getEcdsaPublic(sharePtr, pubKeyPtr, sizePtr));
            return readBytes(this.m, pubKeyPtr, readInt(this.m, sizePtr));
        }
        finally {
            this.m._free(pubKeyPtr);
            this.m._free(sizePtr);
            this.b.freeShare(sharePtr);
        }
    }
    // --- Verification (standalone, no protocol) ---
    verifyEddsa(pubKey, data, signature) {
        const pubKeyPtr = allocBytes(this.m, pubKey);
        const dataPtr = allocBytes(this.m, data);
        const sigPtr = allocBytes(this.m, signature);
        try {
            const rv = this.b.verifyEddsa(pubKeyPtr, dataPtr, data.length, sigPtr);
            return rv === 0;
        }
        finally {
            this.m._free(pubKeyPtr);
            this.m._free(dataPtr);
            this.m._free(sigPtr);
        }
    }
    verifyEcdsa(pubKey, data, signature) {
        const pubKeyPtr = allocBytes(this.m, pubKey);
        const dataPtr = allocBytes(this.m, data);
        const sigPtr = allocBytes(this.m, signature);
        try {
            const rv = this.b.verifyEcdsa(pubKeyPtr, pubKey.length, dataPtr, data.length, sigPtr, signature.length);
            return rv === 0;
        }
        finally {
            this.m._free(pubKeyPtr);
            this.m._free(dataPtr);
            this.m._free(sigPtr);
        }
    }
    // --- Share info ---
    getShareInfo(share) {
        const sharePtr = this.deserializeSharePtr(share);
        // mpc_crypto_share_info_t: uint64 uid + uint32 type (with padding)
        const infoPtr = this.m._malloc(16);
        try {
            checkRv(this.b.shareInfo(sharePtr, infoPtr));
            const lo = this.m.getValue(infoPtr, "i32") >>> 0;
            const hi = this.m.getValue(infoPtr + 4, "i32") >>> 0;
            const uid = BigInt(hi) * BigInt(0x100000000) + BigInt(lo);
            const type = this.m.getValue(infoPtr + 8, "i32");
            return { uid, type };
        }
        finally {
            this.m._free(infoPtr);
            this.b.freeShare(sharePtr);
        }
    }
    getBIP32Info(share) {
        const sharePtr = this.deserializeSharePtr(share);
        // bip32_info_t: int hardened, uint8 level, uint32 child_number, uint32 parent_fingerprint, uint8[32] chain_code
        const infoPtr = this.m._malloc(48);
        try {
            checkRv(this.b.getBIP32Info(sharePtr, infoPtr));
            const hardened = this.m.getValue(infoPtr, "i32") !== 0;
            const level = this.m.HEAPU8[infoPtr + 4];
            // padding to offset 8 for uint32
            const childNumber = this.m.getValue(infoPtr + 8, "i32") >>> 0;
            const parentFingerprint = this.m.getValue(infoPtr + 12, "i32") >>> 0;
            const chainCode = readBytes(this.m, infoPtr + 16, 32);
            return { hardened, level, childNumber, parentFingerprint, chainCode };
        }
        finally {
            this.m._free(infoPtr);
            this.b.freeShare(sharePtr);
        }
    }
    serializePubBIP32(share) {
        const sharePtr = this.deserializeSharePtr(share);
        const sizePtr = allocInt(this.m);
        try {
            // First call to get size
            checkRv(this.b.serializePubBIP32(sharePtr, 0, sizePtr));
            const size = readInt(this.m, sizePtr);
            const bufPtr = this.m._malloc(size);
            try {
                this.m.setValue(sizePtr, size, "i32");
                checkRv(this.b.serializePubBIP32(sharePtr, bufPtr, sizePtr));
                let len = readInt(this.m, sizePtr);
                // Strip null terminator if present
                const raw = this.m.HEAPU8[bufPtr + len - 1];
                if (raw === 0)
                    len--;
                const bytes = readBytes(this.m, bufPtr, len);
                return new TextDecoder().decode(bytes).trim();
            }
            finally {
                this.m._free(bufPtr);
            }
        }
        finally {
            this.m._free(sizePtr);
            this.b.freeShare(sharePtr);
        }
    }
    // --- Reconstruction (recovery only) ---
    reconstructEcdsaKey(share1, share2) {
        const s1Ptr = allocBytes(this.m, share1);
        const s2Ptr = allocBytes(this.m, share2);
        const sizePtr = allocInt(this.m, 0);
        try {
            // First call: get output size
            checkRv(this.b.reconstructEcdsaKey(s1Ptr, share1.length, s2Ptr, share2.length, 0, sizePtr));
            const size = readInt(this.m, sizePtr);
            const outPtr = this.m._malloc(size);
            try {
                this.m.setValue(sizePtr, size, "i32");
                checkRv(this.b.reconstructEcdsaKey(s1Ptr, share1.length, s2Ptr, share2.length, outPtr, sizePtr));
                return readBytes(this.m, outPtr, readInt(this.m, sizePtr));
            }
            finally {
                this.m._free(outPtr);
            }
        }
        finally {
            this.m._free(s1Ptr);
            this.m._free(s2Ptr);
            this.m._free(sizePtr);
        }
    }
    // --- Helper: run full protocol between two local peers ---
    static runProtocol(ctx1, ctx2) {
        let message = null;
        let finished1 = false;
        let finished2 = false;
        while (!finished1 || !finished2) {
            if (!finished1) {
                const result = ctx1.step(message);
                finished1 = result.finished;
                message = result.message;
            }
            if (message === null)
                break;
            if (!finished2) {
                const result = ctx2.step(message);
                finished2 = result.finished;
                message = result.message;
            }
        }
    }
    // --- Internal helpers ---
    deserializeSharePtr(share) {
        const bufPtr = allocBytes(this.m, share);
        const sharePtrPtr = allocPtr(this.m);
        try {
            checkRv(this.b.shareFromBuf(bufPtr, share.length, sharePtrPtr));
            return readPtr(this.m, sharePtrPtr);
        }
        finally {
            this.m._free(bufPtr);
            this.m._free(sharePtrPtr);
        }
    }
}
export { MPCNativeError };
//# sourceMappingURL=protocol.js.map