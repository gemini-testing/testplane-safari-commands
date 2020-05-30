'use strict';

const proxyquire = require('proxyquire');
const {mkBrowser_} = require('../../utils');
const {WAIT_BETWEEN_ACTIONS_IN_MS} = require('lib/constants');

describe('"dragAndDrop" command', () => {
    let browser, addDragAndDropCommand, getElemCenterLocation;

    beforeEach(() => {
        browser = mkBrowser_();
        getElemCenterLocation = sinon.stub().resolves({x: 0, y: 0});

        addDragAndDropCommand = proxyquire('lib/commands/dragAndDrop', {
            '../command-helpers/element-utils': {getElemCenterLocation}
        });
    });

    afterEach(() => sinon.restore());

    it('should add "dragAndDrop" command', () => {
        addDragAndDropCommand(browser);

        assert.calledOnceWith(browser.addCommand, 'dragAndDrop', sinon.match.func, true);
    });

    it('should get center location of the source and destination selectors', async () => {
        addDragAndDropCommand(browser);

        await browser.dragAndDrop('.src-selector', '.dest-selector');

        assert.calledWith(getElemCenterLocation.firstCall, browser, '.src-selector');
        assert.calledWith(getElemCenterLocation.secondCall, browser, '.dest-selector');
    });

    describe('perform dragAndDrop action', () => {
        it('should execute actions in right order', async () => {
            getElemCenterLocation
                .onFirstCall().resolves({x: 100, y: 200})
                .onSecondCall().resolves({x: 300, y: 400});
            addDragAndDropCommand(browser);

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
