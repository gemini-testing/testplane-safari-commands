'use strict';

const {getSafariVersion} = require('./utils');
const {NEW_SAFARI_VERSION} = require('./constants');

const commonLocators = {
    WEB_VIEW: '~WebView',
    DEVICE_BACK: '~back'
};

const oldSafariLocators = {
    TOP_TOOLBAR: '~Show Toolbar',
    BOTTOM_TOOLBAR: '~BottomBrowserToolbar'
};

const safariNewLocators = {
    BOTTOM_TOOLBAR: '//XCUIElementTypeOther[@name="CapsuleViewController"]/XCUIElementTypeOther[1]',
    VIEW_PORT: '//XCUIElementTypeWebView[@name="WebView"]/XCUIElementTypeWebView/XCUIElementTypeWebView/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther'
};

exports.getNativeLocators = (broConfig) => {
    const currentVersion = getSafariVersion(broConfig);

    if (currentVersion < NEW_SAFARI_VERSION) {
        return {...commonLocators, ...oldSafariLocators};
    }

    return {...commonLocators, ...safariNewLocators};
};
