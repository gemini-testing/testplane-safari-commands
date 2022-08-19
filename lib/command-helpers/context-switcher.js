'use strict';

const {getTestContext, IS_NATIVE_CTX, WEB_VIEW_CTX} = require('./test-context');
const {NATIVE_CONTEXT} = require('../constants');

exports.runInNativeContext = async function(browser, action, testCtx) {
    if (!testCtx) {
        testCtx = getTestContext(browser.executionContext);
    }

    if (testCtx[IS_NATIVE_CTX]) {
        return action.fn.call(browser, ...[].concat(action.args));
    }

    await browser.switchContext(NATIVE_CONTEXT);
    testCtx[IS_NATIVE_CTX] = true;

    const result = await action.fn.call(browser, ...[].concat(action.args));

    await browser.switchContext(browser.options[WEB_VIEW_CTX]);
    testCtx[IS_NATIVE_CTX] = false;

    return result;
};
