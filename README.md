# crypto-mpc

2-party MPC (ECDSA, EdDSA, BIP32) compiled to WebAssembly with TypeScript bindings.

Split blockchain wallet keys between two peers so the full private key **never exists in one place**. Based on the [blockchain-crypto-mpc](https://github.com/nickelc/blockchain-crypto-mpc) C++ library by Unbound Security.

## Features

- **2-party ECDSA** (secp256k1) — key generation, signing, verification
- **2-party EdDSA** (ed25519) — key generation, signing, verification
- **BIP32** HD key derivation (hardened & normal)
- **Key refresh** — re-split shares without changing the underlying key
- **Backup** — zero-knowledge backup for EdDSA and ECDSA keys
- **Generic secrets** — generate or import shared secrets
- **Private key reconstruction** — combine both ECDSA shares to recover the full key
- Works in **Node.js**, **Bun**, and **browsers**

## Install

```bash
npm install crypto-mpc
```

## Quick Start

```js
import { load } from "crypto-mpc/load";

const { peer1, peer2 } = await load();

// Generate an EdDSA key pair (split between two peers)
const ctx1 = peer1.generateEddsaKey();
const ctx2 = peer2.generateEddsaKey();
MPCPeer.runProtocol(ctx1, ctx2);

const share1 = ctx1.getShare();
const share2 = ctx2.getShare();
ctx1.free();
ctx2.free();

// Sign a message
const message = new TextEncoder().encode("hello MPC");
const signCtx1 = peer1.signEddsa(share1, message);
const signCtx2 = peer2.signEddsa(share2, message);
MPCPeer.runProtocol(signCtx1, signCtx2);

const signature = peer1.getEddsaSignResult(signCtx1);
signCtx1.free();
signCtx2.free();

// Verify
const valid = peer1.verifyEddsa(
  peer1.getEddsaPublic(share1),
  message,
  signature,
);
console.log("valid:", valid); // true
```

> **Note:** Import `MPCPeer` from `"crypto-mpc"` when using the class directly.

## Loading

The `crypto-mpc/load` entry point auto-detects your environment:

```js
import { load } from "crypto-mpc/load";

const { module, peer1, peer2, createPeer } = await load();
```

Returns:
- `module` — raw Emscripten module
- `peer1` / `peer2` — pre-configured `MPCPeer` instances
- `createPeer(peer)` — create additional peer instances

For manual loading (e.g., custom WASM path in browser):

```js
import { createPeer } from "crypto-mpc";

const createModule = await import("./wasm/mpc_crypto.js");
const wasmModule = await createModule.default();
const peer1 = createPeer(wasmModule, 1);
const peer2 = createPeer(wasmModule, 2);
```

## Protocol Pattern

All MPC operations follow the same pattern:

1. Both peers create a context for the operation
2. Run the protocol (peers exchange messages until finished)
3. Extract the result
4. Free the contexts

```js
// The static helper runs the full protocol locally:
MPCPeer.runProtocol(ctx1, ctx2);

// For network-separated peers, use step() manually:
let msg = null;
while (true) {
  const r1 = ctx1.step(msg);
  if (r1.finished) break;
  const r2 = ctx2.step(r1.message);
  if (r2.finished) break;
  msg = r2.message;
}
```

## API Reference

### `MPCPeer`

#### Key Generation
| Method | Description |
|--------|-------------|
| `generateEddsaKey()` | Start EdDSA (ed25519) key generation |
| `generateEcdsaKey()` | Start ECDSA (secp256k1) key generation |
| `generateGenericSecret(bits)` | Start generic shared secret generation |
| `importGenericSecret(key)` | Import an existing secret into MPC shares |

#### Signing
| Method | Description |
|--------|-------------|
| `signEddsa(share, data, refresh?)` | Sign data with EdDSA (optionally refresh key) |
| `signEcdsa(share, data, refresh?)` | Sign a 32-byte hash with ECDSA (optionally refresh key) |

#### Verification
| Method | Description |
|--------|-------------|
| `verifyEddsa(pubKey, data, signature)` | Verify an EdDSA signature |
| `verifyEcdsa(pubKey, data, signature)` | Verify an ECDSA signature |

#### Key Operations
| Method | Description |
|--------|-------------|
| `refreshKey(share)` | Re-split share without changing the underlying key |
| `deriveBIP32(share, hardened, index)` | Derive a BIP32 child key |
| `backupEddsaKey(share, pubBackupKey)` | Create a zero-knowledge backup (EdDSA) |
| `backupEcdsaKey(share, pubBackupKey)` | Create a zero-knowledge backup (ECDSA) |

#### Result Extraction
| Method | Description |
|--------|-------------|
| `getEddsaSignResult(ctx)` | Get 64-byte EdDSA signature |
| `getEcdsaSignResult(ctx)` | Get ECDSA signature (DER-encoded) |
| `getDeriveBIP32Result(ctx)` | Get derived child share |
| `getBackupEddsaResult(ctx)` | Get EdDSA backup data |
| `getBackupEcdsaResult(ctx)` | Get ECDSA backup data |

#### Info & Public Keys
| Method | Description |
|--------|-------------|
| `getEddsaPublic(share)` | Get 32-byte ed25519 public key |
| `getEcdsaPublic(share)` | Get secp256k1 public key (DER-encoded) |
| `getShareInfo(share)` | Get share metadata (uid, type) |
| `getBIP32Info(share)` | Get BIP32 info (level, childNumber, chainCode, etc.) |
| `serializePubBIP32(share)` | Get xpub string for an ECDSA share |

#### Reconstruction
| Method | Description |
|--------|-------------|
| `reconstructEcdsaKey(share1, share2)` | Reconstruct full ECDSA private key from both shares |

### `Context`

| Method | Description |
|--------|-------------|
| `step(inMessage)` | Execute one protocol step |
| `getShare()` | Get the updated share after protocol completes |
| `serialize()` | Serialize context for storage/transmission |
| `free()` | Release WASM memory |

### `StepResult`

```ts
interface StepResult {
  finished: boolean;    // true when protocol is complete
  shareChanged: boolean; // true when share was updated (save it!)
  message: Uint8Array | null; // message to send to the other peer
}
```

### Types

```ts
enum KeyType { EdDSA = 2, ECDSA = 3, GenericSecret = 4 }

interface ShareInfo { uid: bigint; type: KeyType }
interface BIP32Info {
  hardened: boolean;
  level: number;
  childNumber: number;
  parentFingerprint: number;
  chainCode: Uint8Array;
}
```

## 2-of-3 Custody with Key Refresh

You can use key refresh to create a 2-of-3 scheme where any 2 of 3 parties can sign:

```js
// Generate key: shares A1, B1
// Refresh once: shares A2, B2 (same underlying key)
// Refresh again: shares A3, B3

// Distribute:
// Party 1: A1 (as peer1), B2 (as peer2)
// Party 2: B1 (as peer2), A3 (as peer1)
// Party 3: A2 (as peer1), B3 (as peer2)

// Any pair of parties can sign together!
```

## License

[GPL-3.0-or-later](./LICENSE)
