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
    });
});
