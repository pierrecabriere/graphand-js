const path = require("path");

module.exports = {
  mode: "development",
  devtool: "source-map",
  optimization: {
    minimize: true,
  },
  entry: {
    main: "./dist/index.js",
  },
  output: {
    path: path.resolve(__dirname),
    filename: "bundle.js",
    library: "graphand-js",
    libraryTarget: "umd",
  },
  resolve: {
    extensions: [".js"],
  },
};
