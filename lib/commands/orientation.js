'use strict';

const {resetTestContextValues, TOP_TOOLBAR_SIZE, BOTTOM_TOOLBAR_LOCATION, WEB_VIEW_SIZE} = require('../command-helpers/test-context');
const {isWdioLatest} = require('../utils');

module.exports = (browser) => {
    const commandName = isWdioLatest(browser) ? 'setOrientation' : 'orientation';
    const baseOrientationFn = browser[commandName];

    browser.addCommand(commandName, async (orientation) => {
        if (orientation && browser.executionContext) {
            resetTestContextValues(browser.executionContext, [TOP_TOOLBAR_SIZE, BOTTOM_TOOLBAR_LOCATION, WEB_VIEW_SIZE]);
        }

        return baseOrientationFn.call(browser, orientation);
    }, true);
};
