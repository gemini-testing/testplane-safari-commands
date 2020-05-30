'use strict';

const {getElemCenterLocation} = require('../command-helpers/element-utils');

module.exports = (browser) => {
    browser.addCommand('touch', async (selector) => {
        const {x, y} = await getElemCenterLocation(browser, selector);

        await browser.touchAction([
            {action: 'tap', x, y}
        ]);
    }, true);
};
