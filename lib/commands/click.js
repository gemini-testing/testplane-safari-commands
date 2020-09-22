'use strict';

module.exports = (browser) => {
    browser.addCommand('click', (selector) => {
        return browser.touch(selector);
    }, true);
};
