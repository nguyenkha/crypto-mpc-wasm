import { createPeer } from "./index.js";

let _modulePromise = null;

async function loadWasmModule(wasmUrl) {
  if (typeof process !== "undefined" && process.versions?.node) {
    // Node.js / Bun
    const { dirname, join } = await import("path");
    const { fileURLToPath, pathToFileURL } = await import("url");
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const jsPath = join(__dirname, "wasm", "mpc_crypto.js");
    const { default: createModule } = await import(
      pathToFileURL(jsPath).href
    );
    return createModule();
  } else {
    // Browser
    const base = new URL(".", import.meta.url).href;
    const jsUrl = wasmUrl || base + "wasm/mpc_crypto.js";
    const { default: createModule } = await import(jsUrl);
    return createModule({
      locateFile: (path) => base + "wasm/" + path,
    });
  }
}

export async function load(wasmUrl) {
  if (!_modulePromise) {
    _modulePromise = loadWasmModule(wasmUrl);
  }
  const m = await _modulePromise;
  return {
    module: m,
    createPeer: (peer) => createPeer(m, peer),
    peer1: createPeer(m, 1),
    peer2: createPeer(m, 2),
  };
}
