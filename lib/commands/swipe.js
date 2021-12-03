'use strict';

const _ = require('lodash');
const {resetTestContextValues, TOP_TOOLBAR_SIZE, BOTTOM_TOOLBAR_LOCATION} = require('../command-helpers/test-context');
const {WAIT_BETWEEN_ACTIONS_IN_MS} = require('../constants');

module.exports = (browser, {elementUtils}) => {
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

        const {x, y} = await elementUtils.getElemCenterLocation(browser, selector);

        await browser.touchAction([
            {action: 'press', x, y},
            {action: 'wait', ms: speed <= 0 ? WAIT_BETWEEN_ACTIONS_IN_MS : speed},
            {action: 'moveTo', x: x + xOffset, y: y + yOffset},
            'release'
        ]);

        if (yOffset) {
            resetTestContextValues(browser.executionContext, [TOP_TOOLBAR_SIZE, BOTTOM_TOOLBAR_LOCATION]);
        }
    }, true);
};
