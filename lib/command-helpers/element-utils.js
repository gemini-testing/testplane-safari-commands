'use strict';

const {getTestContext} = require('./test-context');
const {runInNativeContext} = require('./context-switcher');
const {TOP_TOOLBAR} = require('../native-locators');

exports.getTopToolbarHeight = async (browser) => {
    const testCtx = getTestContext(browser.executionContext);

    if (!testCtx.topToolbarHeight || testCtx.isVerticalSwipePerformed) {
        const {height} = await runInNativeContext(browser, {fn: browser.getElementSize, args: TOP_TOOLBAR}, testCtx);

        testCtx.topToolbarHeight = height;
        testCtx.isVerticalSwipePerformed = false;
    }

    return testCtx.topToolbarHeight;
};

exports.getElemCoords = async (browser, selector) => {
    const [{width, height}, {x, y}] = await Promise.all([browser.getElementSize(selector), browser.getLocation(selector)]);
    const topToolbarHeight = await exports.getTopToolbarHeight(browser);

    return {width, height, x, y: y + topToolbarHeight};
};

exports.getElemCenterLocation = async (browser, selector) => {
    const {width, height, x, y} = await exports.getElemCoords(browser, selector);

    return {
        x: x + width / 2,
        y: y + height / 2
    };
};
