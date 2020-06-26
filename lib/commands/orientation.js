'use strict';

const {resetTestContextValues, TOP_TOOLBAR_SIZE, BOTTOM_TOOLBAR_LOCATION, WEB_VIEW_SIZE} = require('../command-helpers/test-context');

module.exports = (browser) => {
    const baseOrientationFn = browser.orientation;

    browser.addCommand('orientation', async (orientation) => {
        if (orientation && browser.executionContext) {
            resetTestContextValues(browser.executionContext, [TOP_TOOLBAR_SIZE, BOTTOM_TOOLBAR_LOCATION, WEB_VIEW_SIZE]);
        }

        return baseOrientationFn.call(browser, orientation);
    }, true);
};
