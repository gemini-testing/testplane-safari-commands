'use strict';

exports.getSafariVersion = (broConfig) => {
    const currentVersion = broConfig.desiredCapabilities.version || broConfig.desiredCapabilities.browserVersion;

    return parseInt(currentVersion);
};
