const path = require("path");
const CompressionPlugin = require("compression-webpack-plugin");

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
    path: path.resolve(__dirname, "./dist"),
    filename: "bundle.js",
    library: "graphand-js",
    libraryTarget: "umd",
  },
  resolve: {
    extensions: [".js"],
  },
  plugins: [new CompressionPlugin()],
};
