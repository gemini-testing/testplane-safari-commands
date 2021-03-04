'use strict';

const utils = require('lib/utils');

describe('utils', () => {
    describe('isWdioLatest', () => {
        it('should return "true" if "overwriteCommand" method exists', () => {
            const browser = {overwriteCommand: () => {}};

            assert.isTrue(utils.isWdioLatest(browser));
        });

        it('should return "false" if "overwriteCommand" method does not exist', () => {
            const browser = {};

            assert.isFalse(utils.isWdioLatest(browser));
        });
    });
});
