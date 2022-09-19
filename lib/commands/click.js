'use strict';

module.exports = (browser) => {
    browser.overwriteCommand('click', async function(baseClickFn, opts = {}) {
        return opts.unwrap
            ? baseClickFn()
            : this.touch();
    }, true);

    // TODO
    if (browser.click) {
        browser.overwriteCommand('click', async function(baseClickFn, selector, opts) {
            const elem = await browser.$(selector);
            return elem.click(opts);
        });
    }
};
