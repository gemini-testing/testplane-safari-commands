'use strict';

const {getTestContext, IS_NATIVE_CTX, WEB_VIEW_CTX} = require('./test-context');
const {NATIVE_CONTEXT} = require('../constants');
const debug = require('debug')('hermione-safari-commands:context-switcher');

exports.runInNativeContext = async function(browser, action, testCtx) {
    if (!testCtx) {
        testCtx = getTestContext(browser.executionContext);
    }

    if (testCtx[IS_NATIVE_CTX]) {
        return action.fn.call(browser, ...[].concat(action.args));
    }

    if (!testCtx[WEB_VIEW_CTX]) {
        const {value: contexts} = await browser.contexts();
        debug(`get contexts: ${contexts} for sessionId: ${browser.requestHandler.sessionID}`);
        testCtx[WEB_VIEW_CTX] = contexts[1];
    }

    debug(`before switch context to: ${NATIVE_CONTEXT} for sessionId: ${browser.requestHandler.sessionID}`);
    await browser.context(NATIVE_CONTEXT);
    debug(`after switch context to: ${NATIVE_CONTEXT} for sessionId: ${browser.requestHandler.sessionID}`);
    testCtx[IS_NATIVE_CTX] = true;

    const result = await action.fn.call(browser, ...[].concat(action.args));

    debug(`after call action result: ${JSON.stringify(result)} for sessionId: ${browser.requestHandler.sessionID}`);

    debug(`before switch context to: ${WEB_VIEW_CTX} for sessionId: ${browser.requestHandler.sessionID}`);
    await browser.context(testCtx[WEB_VIEW_CTX]);
    debug(`after switch context to: ${WEB_VIEW_CTX} for sessionId: ${browser.requestHandler.sessionID}`);
    testCtx[IS_NATIVE_CTX] = false;

    return result;
};
