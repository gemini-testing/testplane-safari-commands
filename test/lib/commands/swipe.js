'use strict';

const proxyquire = require('proxyquire');
const {mkBrowser_, matchElemArrayByIndex_} = require('../../utils');
const {WAIT_BETWEEN_ACTIONS_IN_MS} = require('lib/constants');
const {TOP_TOOLBAR_SIZE, BOTTOM_TOOLBAR_LOCATION} = require('lib/command-helpers/test-context');
const {getElementUtils} = require('lib/command-helpers/element-utils');

describe('"swipe" command', () => {
    let browser, addSwipeCommand, resetTestContextValues, elementUtils;

    beforeEach(() => {
        browser = mkBrowser_();
        resetTestContextValues = sinon.stub();
        elementUtils = getElementUtils(browser);
        sinon.stub(elementUtils, 'getElemCenterLocation').resolves({x: 0, y: 0});

        addSwipeCommand = proxyquire('lib/commands/swipe', {
            '../command-helpers/test-context': {resetTestContextValues}
        });
    });

    afterEach(() => sinon.restore());

    it('should add "swipe" command', () => {
        addSwipeCommand(browser, {elementUtils});

        assert.calledOnceWith(browser.addCommand, 'swipe', sinon.match.func);
    });

    it('should throw error if selector is passed as number', async () => {
        addSwipeCommand(browser, {elementUtils});

        await assert.isRejected(
            browser.swipe(100500),
            'Method "swipe" does not implement the functionality "swipe(xspeed, yspeed)"' +
            ' try to use "swipe(selector, xOffset, yOffset, speed)"'
        );
    });

    [
        {name: 'xOffset', args: ['1', 1, 1]},
        {name: 'yOffset', args: [2, '2', 2]},
        {name: 'speed', args: [3, 3, '3']}
    ].forEach(({name, args}) => {
        it(`should throw error if ${name} is passed not as number`, async () => {
            addSwipeCommand(browser, {elementUtils});

            await assert.isRejected(
                browser.swipe('.some-selector', ...args),
                'Arguments "xOffset", "yOffset" and "speed" must be a numbers'
            );
        });
    });

    it('should get center location of the passed selector', async () => {
        addSwipeCommand(browser, {elementUtils});

        await browser.swipe('.some-selector');

        assert.calledOnceWith(elementUtils.getElemCenterLocation, browser, '.some-selector');
    });

    describe('perform swipe action', () => {
        it('should press on the center location of the passed selector', async () => {
            elementUtils.getElemCenterLocation.resolves({x: 100, y: 500});
            addSwipeCommand(browser, {elementUtils});

            await browser.swipe('.some-selector');

            assert.calledOnceWith(
                browser.touchAction,
                sinon.match(matchElemArrayByIndex_({index: 0, value: {action: 'press', x: 100, y: 500}}))
            );
        });

        describe('should wait', () => {
            [
                {title: 'not passed', speed: undefined},
                {title: 'less than zero', speed: -100},
                {title: 'equal to zero', speed: 0}
            ].forEach(({title, speed}) => {
                it(`default time between actions if "speed" is ${title}`, async () => {
                    addSwipeCommand(browser, {elementUtils});

                    await browser.swipe('.some-selector', 0, 0, speed);

                    assert.calledOnceWith(
                        browser.touchAction,
                        sinon.match(matchElemArrayByIndex_({index: 1, value: {action: 'wait', ms: WAIT_BETWEEN_ACTIONS_IN_MS}}))
                    );
                });
            });

            it('passed time between actions if "speed" is passed', async () => {
                addSwipeCommand(browser, {elementUtils});

                await browser.swipe('.some-selector', 0, 0, 100500);

                assert.calledOnceWith(
                    browser.touchAction,
                    sinon.match(matchElemArrayByIndex_({index: 1, value: {action: 'wait', ms: 100500}}))
                );
            });
        });

        it('should move finger to coordinates with passed offsets', async () => {
            elementUtils.getElemCenterLocation.resolves({x: 200, y: 400});
            addSwipeCommand(browser, {elementUtils});

            await browser.swipe('.some-selector', 100, -200);

            assert.calledOnceWith(
                browser.touchAction,
                sinon.match(matchElemArrayByIndex_({index: 2, value: {action: 'moveTo', x: 200 + 100, y: 400 - 200}}))
            );
        });

        it('should execute actions in right order', async () => {
            elementUtils.getElemCenterLocation.resolves({x: 200, y: 400});
            addSwipeCommand(browser, {elementUtils});

            await browser.swipe('.some-selector', 10);

            assert.calledOnceWith(
                browser.touchAction,
                sinon.match.array.deepEquals([
                    {action: 'press', x: 200, y: 400},
                    {action: 'wait', ms: WAIT_BETWEEN_ACTIONS_IN_MS},
                    {action: 'moveTo', x: 200 + 10, y: 400},
                    'release'
                ])
            );
        });
    });

    it('should reset toolbar values in test context if "yOffset" is passed', async () => {
        addSwipeCommand(browser, {elementUtils});

        await browser.swipe('.some-selector', 0, 100);

        assert.calledOnceWith(resetTestContextValues, browser.executionContext, [TOP_TOOLBAR_SIZE, BOTTOM_TOOLBAR_LOCATION]);
    });

    it('should not reset toolbar values in test context if "yOffset" is not passed', async () => {
        addSwipeCommand(browser, {elementUtils});

        await browser.swipe('.some-selector');

        assert.notCalled(resetTestContextValues);
    });
});
