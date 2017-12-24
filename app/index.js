const express = require("express");

require("./utils");
require("./chatChanels");
require("./commands");
const api = require("./api");
require("./server");

const app = express();

app.use("/api", api);

app.listen(process.env.NODE_PORT || process.env.PORT || 8282);

// started
console.timeLog("Server started, type " + "help".info + " or " + "?".info);

module.exports = app;
