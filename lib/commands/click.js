'use strict';

module.exports = (browser) => {
    const baseClickFn = browser.click;

    browser.addCommand('click', (selector, opts = {}) => {
        return opts.unwrap
            ? baseClickFn.call(browser, selector)
            : browser.touch(selector);
    }, true);
};
