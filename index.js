"use strict";

if (process.env.NODE_ENV === "production") {
  module.exports = require("./dist/bundle.js.gz");
} else {
  module.exports = require("./dist/index.js");
}
