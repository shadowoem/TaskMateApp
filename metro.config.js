const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Добавляем моки для Node.js модулей
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  http: path.resolve(__dirname, "mocks/http.js"),
  https: path.resolve(__dirname, "mocks/https.js"),
  stream: path.resolve(__dirname, "mocks/stream.js"),
  crypto: path.resolve(__dirname, "mocks/crypto.js"),
  net: path.resolve(__dirname, "mocks/net.js"),
  tls: path.resolve(__dirname, "mocks/tls.js"),
  zlib: path.resolve(__dirname, "mocks/zlib.js"),
  buffer: path.resolve(__dirname, "mocks/buffer.js"),
  ws: path.resolve(__dirname, "mocks/ws.js"),
};

// Исправленная секция blockList
config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList)
    ? config.resolver.blockList
    : []),
  /node_modules\/ws\//,
];

module.exports = config;
