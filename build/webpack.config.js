const { resolve, basename, extname } = require("path");
const { promisify } = require("util");
const glob = promisify(require("glob"));

const { merge } = require("webpack-merge");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

const filename = (name) => basename(name, extname(name));

const development = (PATH) => ({
  mode: "development",

  devtool: "inline-source-map",

  devServer: {
    contentBase: PATH.OUTPUT,
    clientLogLevel: "silent",
    compress: true,
    open: true,
    port: 3000,
  },
});

const production = () => ({
  mode: "production",

  devtool: "source-map",
});

const common = (PATH) => ({
  // === Entry ===
  entry: PATH.ENTRY.JS,

  // === Output ===
  output: {
    path: PATH.OUTPUT,
    filename: "scripts/[name].js",
  },

  // === Loader ===
  module: {
    rules: [
      // === Handlebars ===
      { test: /\.handlebars$/, loader: "handlebars-loader" },
    ],
  },

  // === Plugin ===
  plugins: [
    // === Clear dist ===
    new CleanWebpackPlugin(),

    // === Build HTML ===
    ...PATH.ENTRY.HTML.map(
      (template) =>
        new HtmlWebpackPlugin({
          title: "Bankee Credit",
          filename: filename(template) + ".html",
          template,
        })
    ),
  ],
});

module.exports = async () => {
  const path = (...paths) => resolve(__dirname, "..", ...paths);

  const PATH = {
    ENTRY: {
      JS: path("src/scripts/app.js"),
      HTML: await glob(path("src/*.handlebars")),
    },
    OUTPUT: path("dist"),
  };

  switch (process.env.NODE_ENV) {
    case "production":
      return merge(common(PATH), production(PATH));

    default:
      return merge(common(PATH), development(PATH));
  }
};
