'use strict';

const _ = require('lodash');
const EventEmitter2 = require('eventemitter2');
const proxyquire = require('proxyquire');

const commands = require('lib/commands');
const utils = require('lib/utils');
const {NATIVE_CONTEXT} = require('lib/constants');
const {WEB_VIEW_CTX} = require('lib/command-helpers/test-context');
const {mkConfig_, mkBrowser_} = require('../utils');

describe('plugin', () => {
    let initialDocument, plugin, getElementUtils, getNativeLocators;

    const mkHermione_ = (opts = {}) => {
        opts = _.defaults(opts, {
            proc: 'master',
            browsers: {}
        });

        const hermione = new EventEmitter2();

        hermione.events = {
            NEW_BROWSER: 'newBrowser',
            SESSION_START: 'sessionStart',
            AFTER_TESTS_READ: 'afterTestsRead'
        };
        hermione.isWorker = sinon.stub().returns(opts.proc === 'worker');
        hermione.config = {
            forBrowser: (id) => opts.browsers[id] || {desiredCapabilities: {}}
        };

        return hermione;
    };

    beforeEach(() => {
        sinon.stub(utils, 'isWdioLatest').returns(false);

        Object.keys(commands).forEach((command) => {
            commands[command] = sinon.stub();
        });

        global.document = {
            createElement: sinon.stub(),
            body: {
                append: sinon.stub()
            }
        };

        initialDocument = global.document;

        getNativeLocators = sinon.stub();
        getElementUtils = sinon.stub();

        plugin = proxyquire('lib', {
            './native-locators': {getNativeLocators},
            './command-helpers/element-utils': {getElementUtils}
        });
    });

    afterEach(() => {
        sinon.restore();
        global.document = initialDocument;
    });

    it('should do nothing if plugin is disabled', () => {
        const hermione = mkHermione_();
        sinon.spy(hermione, 'on');

        plugin(hermione, mkConfig_({enabled: false}));

        assert.notCalled(hermione.on);
    });

    describe('master process', () => {
        describe('"SESSION_START" event', () => {
            it('should do nothing if browser does not exist in plugin config', async () => {
                const hermione = mkHermione_({proc: 'master'});

                plugin(hermione, mkConfig_({
                    browsers: {
                        b1: {
                            commands: []
                        }
                    }
                }));
                const browser = mkBrowser_();

                await hermione.emitAsync(hermione.events.SESSION_START, browser, {browserId: 'b2'});

                assert.notCalled(browser.execute);
            });

            it('should create fake input and focus on it for plugin browsers', async () => {
                const hermione = mkHermione_({proc: 'master'});

                plugin(hermione, mkConfig_({
                    browsers: {
                        b1: {
                            commands: []
                        }
                    }
                }));

                const fakeInput = {
                    setAttribute: sinon.stub(),
                    focus: sinon.stub()
                };
                global.document.createElement.returns(fakeInput);

                const browser = mkBrowser_();
                browser.execute.callsFake(() => {
                    browser.execute.firstCall.args[0]();
                });

                await hermione.emitAsync(hermione.events.SESSION_START, browser, {browserId: 'b1'});

                assert.calledWith(document.createElement, 'input');
                assert.calledWith(fakeInput.setAttribute, 'type', 'text');
                assert.calledWith(document.body.append, fakeInput);
                assert.callOrder(fakeInput.setAttribute, global.document.body.append, fakeInput.focus);
            });

            [
                {
                    name: 'latest', contexts: [NATIVE_CONTEXT, 'WEBVIEW_12345'],
                    ctxsCmdName: 'getContexts', isWdioLatestRes: true
                },
                {
                    name: 'old', contexts: {value: [NATIVE_CONTEXT, 'WEBVIEW_12345']},
                    ctxsCmdName: 'contexts', isWdioLatestRes: false
                }
            ].forEach(({name, contexts, ctxsCmdName, isWdioLatestRes}) => {
                describe(`executed with ${name} wdio`, () => {
                    it('should save web view context in session options', async () => {
                        const hermione = mkHermione_({proc: 'master'});

                        plugin(hermione, mkConfig_({
                            browsers: {
                                b1: {
                                    commands: []
                                }
                            }
                        }));

                        const browser = mkBrowser_();
                        browser[ctxsCmdName].resolves(contexts);
                        utils.isWdioLatest.returns(isWdioLatestRes);

                        await hermione.emitAsync(hermione.events.SESSION_START, browser, {browserId: 'b1'});

                        assert.calledOnceWith(browser.extendOptions, {[WEB_VIEW_CTX]: 'WEBVIEW_12345'});
                    });
                });
            });
        });
    });

    describe('worker process', () => {
        it('should not subscribe on "SESSION_START" event', () => {
            const hermione = mkHermione_({proc: 'worker'});
            sinon.spy(hermione, 'on');

            plugin(hermione, mkConfig_({
                browsers: {
                    b1: {
                        commands: []
                    }
                }
            }));

            assert.isTrue(hermione.on.neverCalledWith(hermione.events.SESSION_START));
        });

        describe('"NEW_BROWSER" event', () => {
            it('should throws if passed command is not implemented', () => {
                const hermione = mkHermione_({proc: 'worker'});

                plugin(hermione, mkConfig_({
                    browsers: {
                        b1: {
                            commands: ['non_existent_cmd']
                        }
                    }
                }));

                assert.throws(() => {
                    hermione.emit(hermione.events.NEW_BROWSER, {}, {browserId: 'b1'});
                }, TypeError, 'Can not find "non_existent_cmd" command');
            });

            it('should not throw if created browser is not specified in config', () => {
                const hermione = mkHermione_({proc: 'worker'});

                plugin(hermione, mkConfig_({
                    browsers: {
                        b1: {
                            commands: ['some-command']
                        }
                    }
                }));

                assert.doesNotThrow(() => {
                    hermione.emit(hermione.events.NEW_BROWSER, {}, {browserId: 'non-wrapped-bro'});
                });
            });

            it('should call passed command', () => {
                const browser = mkBrowser_();
                const browserConfig = {foo: 'bar', desiredCapabilities: {}};
                const hermione = mkHermione_({
                    proc: 'worker',
                    browsers: {
                        b1: browserConfig
                    }
                });

                plugin(hermione, mkConfig_({
                    browsers: {
                        b1: {
                            commands: ['swipe']
                        }
                    }
                }));

                getNativeLocators.returns({some: 'locators'});
                getElementUtils.returns({some: 'utils'});

                hermione.emit(hermione.events.NEW_BROWSER, browser, {browserId: 'b1'});

                assert.calledOnceWith(commands.swipe, browser,
                    {config: browserConfig, elementUtils: {some: 'utils'}, nativeLocators: {some: 'locators'}});
            });

            describe('"orientation" command is not specified in config', () => {
                it('should not wrap "orientation" if "screenshot" command is not specified', () => {
                    const browser = mkBrowser_();
                    const hermione = mkHermione_({
                        proc: 'worker',
                        browsers: {
                            b1: {}
                        }
                    });

                    plugin(hermione, mkConfig_({
                        browsers: {
                            b1: {
                                commands: ['swipe']
                            }
                        }
                    }));

                    hermione.emit(hermione.events.NEW_BROWSER, browser, {browserId: 'b1'});

                    assert.notCalled(commands.orientation);
                });

                it('should wrap "orientation" if "screenshot" command is specified', () => {
                    const browser = mkBrowser_();
                    const browserConfig = {foo: 'bar'};
                    const hermione = mkHermione_({
                        proc: 'worker',
                        browsers: {
                            b1: browserConfig
                        }
                    });

                    plugin(hermione, mkConfig_({
                        browsers: {
                            b1: {
                                commands: ['screenshot']
                            }
                        }
                    }));
                    getNativeLocators.returns({some: 'locators'});
                    getElementUtils.returns({some: 'utils'});

                    hermione.emit(hermione.events.NEW_BROWSER, browser, {browserId: 'b1'});

                    assert.calledOnceWith(commands.orientation, browser, {config: browserConfig,
                        nativeLocators: {some: 'locators'}, elementUtils: {some: 'utils'}});
                });
            });

            describe('"orientation" command is specified in config', () => {
                it('should not wrap "orientation" again even if "screenshot" command is specified', () => {
                    const browser = mkBrowser_();
                    const hermione = mkHermione_({
                        proc: 'worker',
                        browsers: {
                            b1: {}
                        }
                    });

                    plugin(hermione, mkConfig_({
                        browsers: {
                            b1: {
                                commands: ['orientation', 'screenshot']
                            }
                        }
                    }));

                    hermione.emit(hermione.events.NEW_BROWSER, browser, {browserId: 'b1'});

                    assert.calledOnce(commands.orientation);
                });
            });
        });

        describe('"AFTER_TESTS_READ" event', () => {
            describe('should not add "beforeEach" hook', () => {
                let rootSuite;

                beforeEach(() => {
                    rootSuite = {beforeEach: sinon.spy().named('beforeEach')};
                });

                it('for browsers that not specified in plugin config', () => {
                    const hermione = mkHermione_({proc: 'worker'});
                    plugin(hermione, mkConfig_({
                        browsers: {b1: {}}
                    }));

                    hermione.emit(hermione.events.AFTER_TESTS_READ, {
                        eachRootSuite: (cb) => cb(rootSuite, 'b2')
                    });

                    assert.notCalled(rootSuite.beforeEach);
                });

                it('if test runs in one session', () => {
                    const hermione = mkHermione_({
                        proc: 'worker',
                        browsers: {
                            b1: {testsPerSession: 1}
                        }
                    });
                    plugin(hermione, mkConfig_({
                        browsers: {b1: {}}
                    }));

                    hermione.emit(hermione.events.AFTER_TESTS_READ, {
                        eachRootSuite: (cb) => cb(rootSuite, 'b1')
                    });

                    assert.notCalled(rootSuite.beforeEach);
                });
            });

            it('should change web view context in "beforeEach" hook', async () => {
                const hermione = mkHermione_({
                    proc: 'worker',
                    browsers: {
                        b1: {testsPerSession: 2}
                    }
                });
                plugin(hermione, mkConfig_({
                    browsers: {b1: {}}
                }));

                const rootSuite = {beforeEach: sinon.spy().named('beforeEach')};
                hermione.emit(hermione.events.AFTER_TESTS_READ, {
                    eachRootSuite: (cb) => cb(rootSuite, 'b1')
                });

                const browser = mkBrowser_();
                browser.options = {[WEB_VIEW_CTX]: 'WEBVIEW_12345'};
                const beforeEachHook = rootSuite.beforeEach.lastCall.args[0];
                await beforeEachHook.call({browser});

                assert.calledOnceWith(browser.context, 'WEBVIEW_12345');
            });
        });
    });
});
