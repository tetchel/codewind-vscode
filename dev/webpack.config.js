// Adapted from https://github.com/microsoft/vscode-extension-samples/blob/master/webpack-sample/webpack.config.js

//@ts-check

"use strict";

const path = require("path");
const { FailOnCriticalDependencyPlugin, VSCodeTaskHelperPlugin } = require("./webpack-plugins");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin").default;

const BUNDLE_DIR = "dist";
const OUTPUT_DIR = path.resolve(__dirname, BUNDLE_DIR);

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
 * @param {string} tsconfig - tsconfig file abspath
 */
const baseModuleRules = (tsconfig) => {
    console.log("TSConfig is " + tsconfig);

    return [{
        test: [
            /\.tsx?$/,
            // /\.d.ts$/,
        ],
        exclude: [
            /\.d\.ts$/,
            /node_modules/,
        ],
        use: [{
            loader: "ts-loader",
            options: {
                configFile: tsconfig,
            }
        }]
    }, {
        test: /\.node$/,
        use: "node-loader"
    }];
};

const basePlugins = () => {
    return [
        new FailOnCriticalDependencyPlugin(),
        new VSCodeTaskHelperPlugin(),
    ];
}

/**
 * @param {"production" | "development"} mode
 * @param {object} argv
 * @returns {import("webpack").Configuration}
 */
const baseConfig = (mode, argv) => {
    const devtool = "inline-source-map";

    return {
        mode,
        devtool,
        node: {
            __dirname: false,
            __filename: false
        }
    }
}

/**
 * @returns {import("webpack").Configuration}
 */
const vscodeConfig = (mode, argv) => {
    const entry = path.resolve(__dirname, "src", "extension.ts");     // https://webpack.js.org/configuration/entry-context/
    const outputFilename = "Extension.js";

    return {
        name: "extension",
        ...baseConfig(mode, argv),
        module: {
            rules: baseModuleRules(path.resolve(__dirname, "tsconfig.json")),
        },
        target: "node", // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node
        entry,
        output: { // the output bundle is stored in the "dist" folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
            path: OUTPUT_DIR,
            filename: outputFilename,
            libraryTarget: "commonjs2",
            devtoolModuleFilenameTemplate: "../[resource-path]",
        },
        externals: EXTERNALS,
        plugins: basePlugins(),
        resolve: { // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
            extensions: [ ".ts", ".js" ]
        },
    };
};

/**
 * @returns {import("webpack").Configuration}
 */
/*
const testsConfig = (mode, argv) => {
    const testsPath = path.resolve(__dirname, "src", "test");
    const entry = path.join(testsPath, "Index.ts");
    const outputFilename = "Extension.tests.js";

    return {
        name: "extension-tests",
        ...baseConfig(mode, argv),
        module: {
            rules: baseModuleRules("tsconfig.tests.json"),
        },
        target: "node",
        entry,
        output: {
            path: OUTPUT_DIR,
            filename: outputFilename,
            libraryTarget: "commonjs2",
            devtoolModuleFilenameTemplate: "../[resource-path]",
        },
        externals: {
            ...EXTERNALS,
            // mocha: {
            //     commonjs2: "mocha",
            // }
        },
        resolve: {
            extensions: [ ".ts", ".js" ]
        }
    }
}
*/

/**
 * @returns {import("webpack").Configuration}
 */
const webviewJSConfig = (mode, argv) => {
    const webviewDir = path.resolve(__dirname, "src", "webview");
    const webviewTSConfig = path.join(__dirname, "tsconfig.webview.json");
    const entry = path.join(webviewDir, "ReactClient.tsx");
    const outputFilename = "ReactClient.js";

    const extensions = [ ".ts", ".js", ".tsx", ".jsx", ".scss" ];

    return {
        name: "webview",
        target: "web",
        entry,
        ...baseConfig(mode, argv),
        module: {
            rules: [
                ...baseModuleRules(webviewTSConfig), {
                    test: /\.s[ac]ss$/i,
                    use: [
                        "style-loader",
                        "css-loader",
                        "sass-loader",
                    ],
                },
            ]
        },
        output: {
            path: OUTPUT_DIR,
            filename: outputFilename,
            // libraryTarget: "umd",
            devtoolModuleFilenameTemplate: "../[resource-path]",
        },
        externals: {
            react: "React",
            "react-dom": "ReactDOM"
        },
        plugins: [
            ...basePlugins(),
        ],
        resolve: {
            extensions,
            plugins: [
                new TsconfigPathsPlugin({ configFile: webviewTSConfig })
            ]
        }
    };
}

/**
 * @param {string} env
 * @param {object} argv
 * @returns {import("webpack").Configuration[]}
 */
module.exports = (env, argv) => {
    const mode = env === "dev" ? "development" : "production";
    console.log(`Webpacking in ${mode} mode`);

    let configs = [
        vscodeConfig(mode, argv),
        webviewJSConfig(mode, argv),
    ];

    // if (mode === "development") {
    //     configs.push(testsConfig(mode, argv));
    // }

    // pass --config-name=<name> to build just one of the configs.
    if (argv.configName) {
        const match = configs.find((config) => config.name === argv.configName);
        if (!match) {
            throw new Error(`Couldn't find config with matching name "${argv.configName}"`);
        }
        configs = [ match ];
    }

    configs.forEach((config) => {
        console.log(`Bundling "${config.name}" from ${config.entry} into ${path.join(config.output.path, config.output.filename.toString())}`);
    });

    return configs;
};
