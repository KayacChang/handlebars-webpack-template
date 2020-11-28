const { resolve, basename, extname } = require("path");
const { promisify } = require("util");
const glob = promisify(require("glob"));

const { merge } = require("webpack-merge");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

const { browserslist } = require("../package.json");

const filename = (name) => basename(name, extname(name));

function getTemplateData(paths, template) {
  const path = paths.find((which) => which.includes(filename(template)));

  return path ? require(path) : {};
}

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
    filename: "scripts/bundle.[hash].js",
  },

  // === Loader ===
  module: {
    rules: [
      // === Handlebars ===
      { test: /\.(handlebars|hbs)$/, loader: "handlebars-loader" },

      // === JS ===
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              [
                "@babel/preset-env",
                { useBuiltIns: "entry", corejs: "3", targets: browserslist },
              ],
            ],
            plugins: ["@babel/plugin-transform-runtime"],
          },
        },
      },

      // === Stylesheets ===
      {
        test: /\.(pcss|sass|scss|css)$/,
        exclude: /node_modules/,
        use: [MiniCssExtractPlugin.loader, "css-loader", "postcss-loader"],
      },
    ],
  },

  // === Plugin ===
  plugins: [
    // === Clear dist ===
    new CleanWebpackPlugin(),

    // === Build StyleSheets ===
    new MiniCssExtractPlugin({
      filename: "styles/bundle.[hash].css",
    }),

    // === Copy Assets ===
    new CopyPlugin({
      patterns: [
        //
        { from: PATH.ASSETS, to: "assets/[name].[hash].[ext]" },
      ],
    }),

    // === Build HTML ===
    ...PATH.ENTRY.HTML.map(
      (template) =>
        new HtmlWebpackPlugin({
          title: "Bankee Credit",
          filename: filename(template) + ".html",
          template,
          templateParameters: getTemplateData(PATH.ENTRY.JSON, template),
        })
    ),
  ],
});

module.exports = async () => {
  const path = (...paths) => resolve(__dirname, "..", ...paths);

  const PATH = {
    ENTRY: {
      JS: path("src/scripts/main.js"),
      HTML: await glob(path("src/*.{handlebars,hbs}")),
      JSON: await glob(path("src/data/*.json")),
    },
    OUTPUT: path("dist"),
    ASSETS: path("src/assets"),
  };

  switch (process.env.NODE_ENV) {
    case "production":
      return merge(common(PATH), production(PATH));

    default:
      return merge(common(PATH), development(PATH));
  }
};
