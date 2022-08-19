'use strict';

const _ = require('lodash');
const {getTestContext} = require('../test-context');
const {runInNativeContext} = require('../context-switcher');

/**
 * Decorator which checks that locator is existing on the page before perform action.
 * @param {Object} action - action which should be done after check that element exists.
 * @param {Function} action.fn - async/sync function.
 * @param {(*|*[])} action.args - arguments that passed to `action.fn`.
 * @param {*} action.default - default value that returned if locator does not exist.
 *
 * @returns {Promise}
 */
exports.withExisting = async function(action) {
    const locator = _.isArray(action.args) ? action.args[1] : action.args;
    const elem = await this.$(locator);
    const isExisting = await elem.isExisting();

    if (!isExisting) {
        return action.default;
    }

    return action.fn.call(this, ...[].concat(action.args));
};

/**
 * Decorator which run action in native context.
 * @param {Object} action - action which should be done in native context.
 * @param {Function} action.fn - async/sync function.
 * @param {(*|*[])} action.args - arguments that passed to `action.fn`.
 *
 * @returns {Promise}
 */
exports.withNativeCtx = async function(action) {
    return runInNativeContext(this, action);
};

/**
 * Decorator which memoize result of calling action and use it on subsequent calls.
 * @param {Object} action - action which should be done if result is not yet memoized.
 * @param {Function} action.fn - async/sync function.
 * @param {(*|*[])} action.args - arguments that passed to `action.fn`.
 * @param {string} key - key name by which the result is memoized.
 *
 * @returns {Promise}
 */
exports.withTestCtxMemo = async function(action, key) {
    const testCtx = getTestContext(this.executionContext);

    if (!testCtx[key]) {
        testCtx[key] = await action.fn.call(this, ...[].concat(action.args));
    }

    return testCtx[key];
};
