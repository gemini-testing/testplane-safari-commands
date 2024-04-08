'use strict';

const _ = require('lodash');
const parseConfig = require('lib/config');

describe('config', () => {
    describe('"enabled" option', () => {
        it('should be enabled by default', () => {
            assert.isTrue(parseConfig({}).enabled);
        });
    });

    describe('"browsers" option', () => {
        const mkBrowser_ = (opts = {}) => {
            return _.defaults(opts, {
                commands: ['default-command']
            });
        };
        const mkNativeElementsSize_ = (opts = {}) => {
            return _.defaults(opts, {
                topToolbar: {
                    height: 47,
                    width: 390
                },
                bottomToolbar: {
                    height: 113,
                    width: 390
                },
                webview: {
                    height: 654,
                    width: 390
                }
            });
        };

        describe('commands', () => {
            describe('should throw error if "commands" option', () => {
                it('is not set', () => {
                    const readConfig = {
                        browsers: {
                            b1: mkBrowser_({commands: null})
                        }
                    };

                    assert.throws(() => parseConfig(readConfig), Error, 'Each browser must have "commands" option');
                });

                it('is not an array of strings', () => {
                    const readConfig = {
                        browsers: {
                            b1: mkBrowser_({commands: [123]})
                        }
                    };

                    assert.throws(() => parseConfig(readConfig), Error, '"commands" must be an array of strings but got [123]');
                });
            });

            it('should set "commands" option', () => {
                const readConfig = {
                    browsers: {
                        b1: mkBrowser_({commands: ['foo']})
                    }
                };

                const config = parseConfig(readConfig);

                assert.deepEqual(config.browsers.b1.commands, ['foo']);
            });
        });

        describe('nativeElementsSize', () => {
            describe('topToolbar', () => {
                describe('should throw error if "topToolbar.height" option', () => {
                    it('is not a number', () => {
                        const readConfig = {
                            browsers: {
                                b1: mkBrowser_({nativeElementsSize: mkNativeElementsSize_({topToolbar: {height: '1', width: 1}})})
                            }
                        };

                        assert.throws(() => parseConfig(readConfig), Error, 'Property "nativeElementsSize.topToolbar.height" must be a number but got string');
                    });
                });

                describe('should throw error if "topToolbar.width" option', () => {
                    it('is not a number', () => {
                        const readConfig = {
                            browsers: {
                                b1: mkBrowser_({nativeElementsSize: mkNativeElementsSize_({topToolbar: {width: '1', height: 1}})})
                            }
                        };

                        assert.throws(() => parseConfig(readConfig), Error, 'Property "nativeElementsSize.topToolbar.width" must be a number but got string');
                    });
                });

                it('should set "topToolbar" option', () => {
                    const readConfig = {
                        browsers: {
                            b1: mkBrowser_({nativeElementsSize: mkNativeElementsSize_()})
                        }
                    };

                    const config = parseConfig(readConfig);

                    assert.deepEqual(config.browsers.b1.nativeElementsSize.topToolbar, {
                        height: 47,
                        width: 390
                    });
                });
            });
            describe('bottomToolbar', () => {
                describe('should throw error if "bottomToolbar.height" option', () => {
                    it('is not a number', () => {
                        const readConfig = {
                            browsers: {
                                b1: mkBrowser_({nativeElementsSize: mkNativeElementsSize_({bottomToolbar: {height: '1', width: 1}})})
                            }
                        };

                        assert.throws(() => parseConfig(readConfig), Error, 'Property "nativeElementsSize.bottomToolbar.height" must be a number but got string');
                    });
                });

                describe('should throw error if "bottomToolbar.width" option', () => {
                    it('is not a number', () => {
                        const readConfig = {
                            browsers: {
                                b1: mkBrowser_({nativeElementsSize: mkNativeElementsSize_({bottomToolbar: {width: '1', height: 1}})})
                            }
                        };

                        assert.throws(() => parseConfig(readConfig), Error, 'Property "nativeElementsSize.bottomToolbar.width" must be a number but got string');
                    });
                });

                it('should set "bottomToolbar" option', () => {
                    const readConfig = {
                        browsers: {
                            b1: mkBrowser_({nativeElementsSize: mkNativeElementsSize_()})
                        }
                    };

                    const config = parseConfig(readConfig);

                    assert.deepEqual(config.browsers.b1.nativeElementsSize.bottomToolbar, {
                        height: 113,
                        width: 390
                    });
                });
            });
            describe('webview', () => {
                describe('should throw error if "webview.height" option', () => {
                    it('is not a number', () => {
                        const readConfig = {
                            browsers: {
                                b1: mkBrowser_({nativeElementsSize: mkNativeElementsSize_({webview: {height: '1', width: 1}})})
                            }
                        };

                        assert.throws(() => parseConfig(readConfig), Error, 'Property "nativeElementsSize.webview.height" must be a number but got string');
                    });
                });

                describe('should throw error if "webview.width" option', () => {
                    it('is not a number', () => {
                        const readConfig = {
                            browsers: {
                                b1: mkBrowser_({nativeElementsSize: mkNativeElementsSize_({webview: {width: '1', height: 1}})})
                            }
                        };

                        assert.throws(() => parseConfig(readConfig), Error, 'Property "nativeElementsSize.webview.width" must be a number but got string');
                    });
                });

                it('should set "webview" option', () => {
                    const readConfig = {
                        browsers: {
                            b1: mkBrowser_({nativeElementsSize: mkNativeElementsSize_()})
                        }
                    };

                    const config = parseConfig(readConfig);

                    assert.deepEqual(config.browsers.b1.nativeElementsSize.webview, {
                        height: 654,
                        width: 390
                    });
                });
            });
        });
    });
});
