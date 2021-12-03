'use strict';

exports.isWdioLatest = (browser) => Boolean(browser.overwriteCommand);

exports.getSafariVersion = (broConfig) => {
    const currentVersion = broConfig.desiredCapabilities.version || broConfig.desiredCapabilities.browserVersion;

    return parseInt(currentVersion);
};
