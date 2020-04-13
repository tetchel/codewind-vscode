// Adapted from https://github.com/microsoft/vscode-extension-samples/blob/master/webpack-sample/webpack.config.js

//@ts-check

"use strict";

const path = require("path");
const webpack = require("webpack");
const { FailOnCriticalDependencyPlugin, VSCodeTaskHelperPlugin } = require("./webpack-plugins");

const BUNDLE_DIR = "dist";

const EXTERNALS = {
    // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'd, 📖 -> https://webpack.js.org/configuration/externals/
    vscode: "commonjs vscode",

    // Place 'critical dependencies' here - See https://code.visualstudio.com/api/working-with-extensions/bundling-extension#webpack-critical-dependencies
    // Anything excluded here needs to be excluded with a negative glob in .vscodeignore

    // keyv/index.js has a dynamic require which causes us to have to bundle it statically with its single dependency
    keyv: "commonjs keyv",
    "json-buffer": "commonjs json-buffer",
};

/**
 * @param {string} env
 * @param {object} argv
 * @param {string} tsconfig - tsconfig file relative to this file
 * @param {boolean} projectReferences
 * @returns {import("webpack").Configuration}
 */
const baseConfig = (env, argv, tsconfig, projectReferences) => {
    const useDevMode = env === "dev";
    const mode = useDevMode ? "development" : "production";
    // const devtool = useDevMode ? "eval-source-map" : "inline-source-map";
    const devtool = "inline-source-map";

    return {
        mode,
        devtool,
        module: {
            rules: [{
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: [{
                    loader: "ts-loader",
                    options: {
                        configFile: path.resolve(__dirname, tsconfig),
                        projectReferences,
                    }
                }],
            }, {
                test: /\.node$/,
                use: "node-loader"
            }]
        },
        plugins: [
            new FailOnCriticalDependencyPlugin(),
            new VSCodeTaskHelperPlugin(),
            new webpack.WatchIgnorePlugin([
                /\.js$/,
                /\.d\.ts$/
            ]),
        ]
    }
}

/**
 * @param {string} env
 * @param {object} argv
 * @returns {import("webpack").Configuration}
 */
const vscodeConfig = (env, argv) => {
    const entry = path.resolve(__dirname, "src", "extension.ts");     // https://webpack.js.org/configuration/entry-context/

    const outputDir = path.resolve(__dirname, BUNDLE_DIR);
    const outputFilename = "Extension.js";

    console.log(`Bundling the VS Code extension from ${entry} into ${path.join(outputDir, outputFilename)}`);

    return {
        ...baseConfig(env, argv, "tsconfig.json", true),
        target: "node", // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node
        entry,
        output: { // the output bundle is stored in the "dist" folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
            path: outputDir,
            filename: outputFilename,
            libraryTarget: "commonjs2",
            devtoolModuleFilenameTemplate: "../[resource-path]",
        },
        externals: EXTERNALS,
        resolve: { // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
            extensions: [".ts", ".js" ]
        },
    };
};

/**
 * @param {string} env
 * @param {object} argv
 * @returns {import("webpack").Configuration}
 */
const testsConfig = (env, argv) => {
    const entry = path.resolve(__dirname, "src", "test", "Base.test.ts");
    const outputDir = path.resolve(__dirname, BUNDLE_DIR);
    const outputFilename = "Extension.tests.js";

    console.log(`Bundling the tests from ${entry} into ${path.join(outputDir, outputFilename)}`);

    return {
        ...baseConfig(env, argv, "tsconfig.tests.json", true),
        target: "node",
        entry,
        output: {
            path: outputDir,
            filename: outputFilename,
            libraryTarget: "commonjs2",
            devtoolModuleFilenameTemplate: "../[resource-path]",
        },
        externals: EXTERNALS,
        resolve: {
            extensions: [".ts", ".js" ]
        }
    }
}

/**
 * @param {string} env
 * @param {object} argv
 * @returns {import("webpack").Configuration}
 */
const webviewConfig = (env, argv) => {
    const entry = path.resolve(__dirname, "src", "webview", "ReactClient.ts");
    const outputDir = path.resolve(__dirname, BUNDLE_DIR);
    const outputFilename = "ReactClient.js";

    console.log(`Bundling the webview frontend from ${entry} into ${path.join(outputDir, outputFilename)}`);

    return {
        ...baseConfig(env, argv, "tsconfig.webview.json", false),
        target: "web",
        entry,
        output: {
            path: outputDir,
            filename: outputFilename,
            // libraryTarget: "commonjs2",
            devtoolModuleFilenameTemplate: "../[resource-path]",
        },
        resolve: {
            extensions: [".ts", ".js", ".tsx", ".jsx" ]
        }
    };
}

/**
 * @param {string} env
 * @param {object} argv
 * @returns {import("webpack").Configuration[]}
 */
module.exports = (env, argv) => {
    return [
        vscodeConfig(env, argv),
        testsConfig(env, argv),
        webviewConfig(env, argv),
    ];
};
