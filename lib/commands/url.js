'use strict';

const {PAGE_LOAD_TIMEOUT} = require('../constants');

module.exports = (browser, {config}) => {
    const pageLoadTimeout = config.pageLoadTimeout || PAGE_LOAD_TIMEOUT;

    browser.overwriteCommand('url', async (baseUrlFn, uri) => {
        if (!uri) {
            return baseUrlFn(uri);
        }

        // in order to clear the page from previous search result
        await browser.execute(() => document.body && document.body.remove());
        await baseUrlFn(uri);

        await browser.waitUntil(
            async () => {
                const elem = await browser.$('body');
                return elem.isDisplayed();
            },
            pageLoadTimeout,
            `The page did not load in ${pageLoadTimeout} ms`
        );
    });
};
