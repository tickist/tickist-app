import admin from "firebase-admin";
import { defineConfig } from "cypress";
import { nxE2EPreset } from "@nrwl/cypress/plugins/cypress-preset";
import { plugin as cypressFirebasePlugin } from "cypress-firebase";
import webpackPreprocessor from "@cypress/webpack-preprocessor";
import pathsPlugin from "tsconfig-paths-webpack-plugin";
import path from "path";

const cypressJsonConfig = {
    fileServerFolder: ".",
    fixturesFolder: "./src/fixtures",
    video: true,
    videosFolder: "../../dist/cypress/apps/tickist-web-e2e/videos",
    screenshotsFolder: "../../dist/cypress/apps/tickist-web-e2e/screenshots",
    chromeWebSecurity: false,
    retries: {
        runMode: 2,
        openMode: 0,
    },
    projectId: "izprxt",
    specPattern: "src/e2e/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "src/support/e2e.ts",
};

export default defineConfig({
    e2e: {
    ...nxE2EPreset(__dirname),
    ...cypressJsonConfig,
    setupNodeEvents(on, config) {
            on(
                "file:preprocessor",
                webpackPreprocessor({
                    webpackOptions: {
                        resolve: {
                            extensions: [".ts", ".js"],
                            plugins: [
                                new pathsPlugin({
                                    configFile: path.join(__dirname, "./tsconfig.e2e.json"),
                                    extensions: [".ts", ".js"],
                                }),
                            ],
                        },
                        module: {
                            rules: [
                                {
                                    test: /\.ts$/,
                                    loader: "ts-loader",
                                    options: {
                                        configFile: path.join(__dirname, "./tsconfig.e2e.json"),
                                        // https://github.com/TypeStrong/ts-loader/pull/685
                                        experimentalWatchApi: true,
                                    },
                                },
                            ],
                        },
                    },
                })
            );
            return cypressFirebasePlugin(on, config, admin, {
                projectId: "proven-reality-657",
            });
            // NOTE: If not setting GCLOUD_PROJECT env variable, project can be set like so:
            // return cypressFirebasePlugin(on, config, admin, { projectId: 'some-project' });
        },
    /**
    * TODO(@nrwl/cypress): In Cypress v12,the testIsolation option is turned on by default. 
    * This can cause tests to start breaking where not indended.
    * You should consider enabling this once you verify tests do not depend on each other
    * More Info: https://docs.cypress.io/guides/references/migration-guide#Test-Isolation
    **/
    testIsolation: false,
 },
});
