const path = require("path");

module.exports = {
  mode: "development",
  devtool: "source-map",
  optimization: {
    minimize: true,
  },
  entry: {
    main: "./src/index.ts",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "index.js",
    library: "graphand-js",
    libraryTarget: "umd",
  },
};
