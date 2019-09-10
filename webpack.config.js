const path = require("path");

module.exports = {
        entry: ["./src/leaflet-radar.ts"],
        mode: "development",
        devtool: "inline-source-map",
        watchOptions: {
                ignored: /node_modules/
        },
        module: {
                rules: [
                        {
                                test: /\.tsx?$/,
                                use: "ts-loader",
                                exclude: "/node_modules/"
                        },
                        {
                                test: /\.(png|woff|woff2|eot|ttf|svg)$/,
                                use: "url-loader"
                        }
                ]
        },
        resolve: {
                extensions: [".tsx", ".ts", ".js"]
        },
        output: {
                filename: "leaflet-radar.js",
                path: path.resolve(__dirname, "dist")
        }
};
