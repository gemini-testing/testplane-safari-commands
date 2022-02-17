'use strict';

const {PAGE_LOAD_TIMEOUT} = require('../constants');

module.exports = (browser, {config}) => {
    const baseUrlFn = browser.url;
    const pageLoadTimeout = config.pageLoadTimeout || PAGE_LOAD_TIMEOUT;

    browser.addCommand('url', async (uri) => {
        if (!uri) {
            return baseUrlFn.call(browser, uri);
        }

        // in order to clear the page from previous search result
        await browser.execute(() => document.body && document.body.remove());
        await baseUrlFn.call(browser, uri);

        await browser.waitUntil(
            () => browser.isVisible('body'),
            pageLoadTimeout,
            `The page did not load in ${pageLoadTimeout} ms`
        );
    }, true);
};
