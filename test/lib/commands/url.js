'use strict';

const _ = require('lodash');
const wrapUrlCommand = require('lib/commands/url');
const {PAGE_LOAD_TIMEOUT} = require('lib/constants');
const {mkBrowser_} = require('../../utils');

describe('"url" command', () => {
    let browser, initialDocument;

    const wrapUrlCommand_ = (browser, opts = {}) => {
        opts = _.defaultsDeep(opts, {
            pageLoadTimeout: null
        });

        wrapUrlCommand(browser, opts);
    };

    beforeEach(() => {
        browser = mkBrowser_();
        initialDocument = global.document;
        global.document = {body: {remove: sinon.stub()}};
    });

    afterEach(() => {
        sinon.restore();
        global.document = initialDocument;
    });

    it('should wrap "url" command', () => {
        wrapUrlCommand_(browser);

        assert.calledOnceWith(browser.addCommand, 'url', sinon.match.func, true);
    });

    it('should call base "url" command if url is not passed', async () => {
        const baseUrlFn = browser.url;
        wrapUrlCommand_(browser);

        await browser.url();

        assert.calledOnce(baseUrlFn);
        assert.notCalled(browser.execute);
    });

    it('should remove body element from the page before make request', async () => {
        const baseUrlFn = browser.url;
        wrapUrlCommand_(browser);

        browser.execute.callsFake(() => {
            browser.execute.firstCall.args[0]();
        });

        await browser.url('/?text=test');

        assert.calledOnceWith(browser.execute, sinon.match.func);
        assert.calledOnce(global.document.body.remove);
        assert.callOrder(browser.execute, baseUrlFn);
    });

    it('should wait until request will be completed', async () => {
        wrapUrlCommand_(browser, {pageLoadTimeout: 100500});

        browser.waitUntil.callsFake(() => {
            browser.waitUntil.firstCall.args[0]();
        });

        await browser.url('/?text=test');

        assert.calledOnceWith(
            browser.waitUntil,
            sinon.match.func,
            100500,
            'The page did not load in 100500 ms'
        );
        assert.calledOnceWith(browser.isVisible, 'body');
    });

    it('should use default "pageLoadTimeout" if it does not specified in browser config', async () => {
        wrapUrlCommand_(browser, {pageLoadTimeout: null});

        await browser.url('/?text=test');

        assert.calledOnceWith(
            browser.waitUntil,
            sinon.match.func,
            PAGE_LOAD_TIMEOUT,
            `The page did not load in ${PAGE_LOAD_TIMEOUT} ms`
        );
    });
});
