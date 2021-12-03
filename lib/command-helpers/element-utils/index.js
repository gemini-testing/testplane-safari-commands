'use strict';

const {getSafariVersion} = require('../../utils');
const {NEW_SAFARI_VERSION} = require('../../constants');

const Safari15Utils = require('./v15.0');
const SafariOldUtils = require('./<v15.0');

exports.getElementUtils = (broConfig, nativeLocators) => {
    const currentVersion = getSafariVersion(broConfig);

    if (currentVersion < NEW_SAFARI_VERSION) {
        return new SafariOldUtils(nativeLocators);
    }

    return new Safari15Utils(nativeLocators);
};
