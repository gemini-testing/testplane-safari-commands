'use strict';

const addDragAndDropCommand = require('lib/commands/dragAndDrop');
const {mkBrowser_} = require('../../utils');
const {WAIT_BETWEEN_ACTIONS_IN_MS} = require('lib/constants');
const {getElementUtils} = require('lib/command-helpers/element-utils');

describe('"dragAndDrop" command', () => {
    let browser, elementUtils;

    beforeEach(() => {
        browser = mkBrowser_();
        elementUtils = getElementUtils(browser);
        sinon.stub(elementUtils, 'getElemCenterLocation').resolves({x: 0, y: 0});
    });

    afterEach(() => sinon.restore());

    it('should add "dragAndDrop" command', () => {
        addDragAndDropCommand(browser, {elementUtils});

        assert.calledOnceWith(browser.addCommand, 'dragAndDrop', sinon.match.func, true);
    });

    it('should get center location of the source and destination selectors', async () => {
        addDragAndDropCommand(browser, {elementUtils});

        await browser.dragAndDrop('.src-selector', '.dest-selector');

        assert.calledWith(elementUtils.getElemCenterLocation.firstCall, browser, '.src-selector');
        assert.calledWith(elementUtils.getElemCenterLocation.secondCall, browser, '.dest-selector');
    });

    describe('perform dragAndDrop action', () => {
        it('should execute actions in right order', async () => {
            elementUtils.getElemCenterLocation
                .onFirstCall().resolves({x: 100, y: 200})
                .onSecondCall().resolves({x: 300, y: 400});
            addDragAndDropCommand(browser, {elementUtils});

            await browser.dragAndDrop('.src-selector', '.dest-selector');

            assert.calledOnceWith(
                browser.touchAction,
                sinon.match.array.deepEquals([
                    {action: 'tap', x: 100, y: 200},
                    {action: 'wait', ms: WAIT_BETWEEN_ACTIONS_IN_MS},
                    {action: 'moveTo', x: 300, y: 400},
                    {action: 'wait', ms: WAIT_BETWEEN_ACTIONS_IN_MS},
                    'release'
                ])
            );
        });
    });
});
