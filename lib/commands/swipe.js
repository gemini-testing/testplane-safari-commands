'use strict';

const _ = require('lodash');
const {getTestContext} = require('../command-helpers/test-context');
const {getElemCenterLocation} = require('../command-helpers/element-utils');
const {WAIT_BETWEEN_ACTIONS_IN_MS} = require('../constants');

module.exports = (browser) => {
    browser.addCommand('swipe', async (selector, xOffset = 0, yOffset = 0, speed = WAIT_BETWEEN_ACTIONS_IN_MS) => {
        if (typeof selector === 'number') {
            throw new TypeError(
                'Method "swipe" does not implement the functionality "swipe(xspeed, yspeed)"' +
                ' try to use "swipe(selector, xOffset, yOffset, speed)"'
            );
        }

        if (!_.isNumber(xOffset) || !_.isNumber(yOffset) || !_.isNumber(speed)) {
            throw new TypeError(
                'Arguments "xOffset", "yOffset" and "speed" must be a numbers'
            );
        }

        const {x, y} = await getElemCenterLocation(browser, selector);

        await browser.touchAction([
            {action: 'press', x, y},
            {action: 'wait', ms: speed <= 0 ? WAIT_BETWEEN_ACTIONS_IN_MS : speed},
            {action: 'moveTo', x: x + xOffset, y: y + yOffset},
            'release'
        ]);

        const testCtx = getTestContext(browser.executionContext);
        testCtx.isVerticalSwipePerformed = Boolean(yOffset);
    }, true);
};
