// shim.js
if (typeof window.WebSocket === "undefined") {
  window.WebSocket = require("react-native-websocket");
}
