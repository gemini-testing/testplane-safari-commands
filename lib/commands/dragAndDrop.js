'use strict';

const {WAIT_BETWEEN_ACTIONS_IN_MS} = require('../constants');

module.exports = (browser, {elementUtils}) => {
    browser.overwriteCommand('dragAndDrop', async function(baseDragAndDropFn, destSelector) {
        const {x: srcX, y: srcY} = await elementUtils.getElemCenterLocation(browser, this.selector);
        const {x: destX, y: destY} = await elementUtils.getElemCenterLocation(browser, destSelector);

        await browser.touchAction([
            {action: 'tap', x: srcX, y: srcY},
            {action: 'wait', ms: WAIT_BETWEEN_ACTIONS_IN_MS},
            {action: 'moveTo', x: destX, y: destY},
            {action: 'wait', ms: WAIT_BETWEEN_ACTIONS_IN_MS},
            'release'
        ]);
    }, true);
};
