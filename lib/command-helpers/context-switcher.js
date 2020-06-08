'use strict';

const {NATIVE_CONTEXT} = require('../constants');

exports.runInNativeContext = async function(browser, action, testCtx) {
    if (!testCtx.webViewContext) {
        const {value: contexts} = await browser.contexts();
        testCtx.webViewContext = contexts[1];
    }

    await browser.context(NATIVE_CONTEXT);
    const result = await action.fn.call(browser, ...[].concat(action.args));
    await browser.context(testCtx.webViewContext);

    return result;
};
