/*
 * Copyright (C) 2022 Tomas Tintera
 *
 * Permission to use, copy, modify, and/or distribute this
 * software for any purpose with or without fee is hereby
 * granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS
 * ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO
 * EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS,
 * WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
 * TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH
 * THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

const fs = require("fs");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  context: __dirname,
  entry: {
    bundle: {
      import: "./src/bundle.js",
      library: {
        type: "var",
        name: "bundle",
      },
    },
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
    environment: {
      arrowFunction: false,
      bigIntLiteral: false,
      const: false,
      destructuring: false,
      dynamicImport: false,
      forOf: false,
      module: false,
      optionalChaining: false,
      templateLiteral: false,
    },
  },
  resolve: {
    extensions: [".js"],
    mainFields: [
      "browser",
      "main",
      "module",
    ],
  },
  mode: "production",
  optimization: {
    /*splitChunks: {
      chunks: "all",
      maxInitialRequests: Infinity,
      minSize: 0,
      cacheGroups: {
        npm: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            var moduleName = "npm-" + module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1].replace('@', '');
            if (moduleName === "npm-eslint") {
              return moduleName;
            } else {
              return "npm-rest";
            }
          },
        },
      },
    },*/
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
        terserOptions: {
          format: {
            comments: false,
            ascii_only: true,
          },
        },
      }),
    ],
  },
  plugins: [
    new NodePolyfillPlugin(),
  ],
  module: {
    rules: [
      {
        exclude: [
          /\.json$/,
          /corejs/,
          /core-js/,
          //path.resolve(__dirname, "bundle.js"),
        ],
        use: [
          {
            loader: "babel-loader",
            options: {
              sourceType: "unambiguous",
              presets: [
                ["@babel/preset-env", {
                }],
              ],
              plugins: [
                ["./src/babel-plugin-transform-unicode-regex-dynamic"],
                ["@babel/plugin-transform-runtime", {
                  corejs: 3,
                  absoluteRuntime: true,
                }],
              ],
            },
          },
        ],
      },
      {
        include: path.resolve(__dirname, "jsbi-git/lib/jsbi.ts"),
        use: [
          {
            loader: "ts-loader",
            options: {
              configFile: path.resolve(__dirname, "tsconfig-jsbi.json"),
            },
          },
        ],
      },
      {
        use: [
          {
            loader: "./src/patch-webpack-loader",
            options: {
              patchDir: "./patches",
            },
          },
        ],
      },
    ],
  },
};
