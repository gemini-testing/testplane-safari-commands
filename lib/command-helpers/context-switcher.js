'use strict';

const {getTestContext, IS_NATIVE_CTX, WEB_VIEW_CTX} = require('./test-context');
const {NATIVE_CONTEXT} = require('../constants');
const {isWdioLatest} = require('../utils');

exports.runInNativeContext = async function(browser, action, testCtx) {
    if (!testCtx) {
        testCtx = getTestContext(browser.executionContext);
    }

    if (testCtx[IS_NATIVE_CTX]) {
        return action.fn.call(browser, ...[].concat(action.args));
    }

    if (!testCtx[WEB_VIEW_CTX]) {
        const result = await browser.contexts();
        const contexts = isWdioLatest(browser) ? result : result.value;

        testCtx[WEB_VIEW_CTX] = contexts[1];
    }

    await browser.context(NATIVE_CONTEXT);
    testCtx[IS_NATIVE_CTX] = true;

    const result = await action.fn.call(browser, ...[].concat(action.args));

    await browser.context(testCtx[WEB_VIEW_CTX]);
    testCtx[IS_NATIVE_CTX] = false;

    return result;
};
