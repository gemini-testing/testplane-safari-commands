'use strict';

const {EventEmitter} = require('events');
const _ = require('lodash');
const plugin = require('lib');
const commands = require('lib/commands');
const {mkConfig_, mkBrowser_} = require('../utils');

describe('plugin', () => {
    const mkHermione_ = (opts = {}) => {
        opts = _.defaults(opts, {
            proc: 'master',
            browsers: {}
        });

        const hermione = new EventEmitter();

        hermione.events = {NEW_BROWSER: 'newBrowser'};
        hermione.isWorker = sinon.stub().returns(opts.proc === 'worker');
        hermione.config = {
            forBrowser: (id) => opts.browsers[id] || {desiredCapabilities: {}}
        };

        return hermione;
    };

    beforeEach(() => {
        Object.keys(commands).forEach((command) => {
            commands[command] = sinon.stub();
        });
    });

    afterEach(() => sinon.restore());

    it('should do nothing if plugin is disabled', () => {
        const hermione = mkHermione_();
        sinon.spy(hermione, 'on');

        plugin(hermione, mkConfig_({enabled: false}));

        assert.notCalled(hermione.on);
    });

    describe('master process', () => {
        it('should do nothing', () => {
            const hermione = mkHermione_({proc: 'master'});
            sinon.spy(hermione, 'on');

            plugin(hermione, mkConfig_());

            assert.notCalled(hermione.on);
        });
    });

    describe('worker process', () => {
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
                            commands: ['swipe']
                        }
                    }
                }));

                hermione.emit(hermione.events.NEW_BROWSER, browser, {browserId: 'b1'});

                assert.calledOnceWith(commands.swipe, browser, browserConfig);
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

                    hermione.emit(hermione.events.NEW_BROWSER, browser, {browserId: 'b1'});

                    assert.calledOnceWith(commands.orientation, browser, browserConfig);
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
    });
});
