'use strict';

const {getElemCenterLocation} = require('../command-helpers/element-utils');
const {WAIT_BETWEEN_ACTIONS_IN_MS} = require('../constants');

module.exports = (browser) => {
    browser.addCommand('dragAndDrop', async (srcSelector, destSelector) => {
        const {x: srcX, y: srcY} = await getElemCenterLocation(browser, srcSelector);
        const {x: destX, y: destY} = await getElemCenterLocation(browser, destSelector);

        await browser.touchAction([
            {action: 'tap', x: srcX, y: srcY},
            {action: 'wait', ms: WAIT_BETWEEN_ACTIONS_IN_MS},
            {action: 'moveTo', x: destX, y: destY},
            {action: 'wait', ms: WAIT_BETWEEN_ACTIONS_IN_MS},
            'release'
        ]);
    }, true);
};
