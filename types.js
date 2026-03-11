export const MPC_PROTOCOL_FINISHED = 1;
export const MPC_SHARE_CHANGED = 2;
export var KeyType;
(function (KeyType) {
    KeyType[KeyType["EdDSA"] = 2] = "EdDSA";
    KeyType[KeyType["ECDSA"] = 3] = "ECDSA";
    KeyType[KeyType["GenericSecret"] = 4] = "GenericSecret";
})(KeyType || (KeyType = {}));
export var MPCError;
(function (MPCError) {
    MPCError[MPCError["BadArg"] = 4278255618] = "BadArg";
    MPCError[MPCError["Format"] = 4278255619] = "Format";
    MPCError[MPCError["TooSmall"] = 4278255624] = "TooSmall";
    MPCError[MPCError["Crypto"] = 4278452225] = "Crypto";
})(MPCError || (MPCError = {}));
//# sourceMappingURL=types.js.map