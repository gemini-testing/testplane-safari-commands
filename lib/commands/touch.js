'use strict';

module.exports = (browser, {elementUtils}) => {
    browser.addCommand('touch', async (selector) => {
        const {x, y} = await elementUtils.getElemCenterLocation(browser, selector);

        await browser.touchAction([
            {action: 'tap', x, y}
        ]);
    }, true);
};
