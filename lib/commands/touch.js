'use strict';

module.exports = (browser, {elementUtils}) => {
    browser.addCommand('touch', async function() {
        const {x, y} = await elementUtils.getElemCenterLocation(browser, this.selector);

        await browser.touchAction([
            {action: 'tap', x, y}
        ]);
    }, true);

    // TODO
    if (browser.touch) {
        browser.overwriteCommand('touch', async function(baseTouchFn, selector) {
            const elem = await browser.$(selector);
            await elem.touch();
        });
    }
};
