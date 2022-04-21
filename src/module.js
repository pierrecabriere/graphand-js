"use strict";

if (process.env.NODE_ENV === "production") {
  module.exports = require("./bundle.js.gz");
} else {
  module.exports = require("./index.js");
}
