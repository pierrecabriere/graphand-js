const path = require("path");

const baseConfig = {
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
    filename: "[name].js",
    library: {
      name: "graphand-js",
      type: "umd",
    },
    globalObject: "this",
  },
  watch: !!parseInt(process.env.WATCH),
  watchOptions: {
    ignored: [path.resolve(__dirname, "node_modules"), path.resolve(__dirname, "docs"), path.resolve(__dirname, "dist")],
  },
};

module.exports = [
  {
    ...baseConfig,
    target: "web",
    output: {
      ...baseConfig.output,
      filename: "browser.min.js",
    },
  },
  {
    ...baseConfig,
    target: "node",
    output: {
      ...baseConfig.output,
      filename: "index.min.js",
    },
  },
];
