'use strict';

const _ = require('lodash');

exports.mkConfig_ = (opts = {}) => {
    return _.defaultsDeep(opts, {
        browsers: {
            b1: {
                commands: ['default-command']
            }
        }
    });
};

exports.matchElemArrayByIndex_ = ({index, value}) => (refValue) => {
    return assert.deepEqual(refValue[index], value) || true;
};

exports.mkBrowser_ = (desiredCapabilities = {}) => {
    const session = Promise.resolve();
    const element = {
        selector: '.selector',
        click: sinon.stub().named('click').resolves(),
        touch: sinon.stub().named('touch').resolves(),
        getSize: sinon.stub().named('getSize').resolves({}),
        isDisplayed: sinon.stub().named('isDisplayed').resolves(),
        isExisting: sinon.stub().named('isExisting').resolves(false)
    };

    session.executionContext = {};
    session.url = sinon.stub().named('url').resolves();
    session.touchAction = sinon.stub().named('touchAction').resolves();
    session.getContext = sinon.stub().named('getContext').resolves({value: 'default-ctx'});
    session.switchContext = sinon.stub().named('switchContext').resolves();
    session.getContexts = sinon.stub().named('getContexts').resolves({value: ['default-ctx-1', 'default-ctx-2']});
    session.execute = sinon.stub().named('execute').resolves();
    session.waitUntil = sinon.stub().named('waitUntil').resolves();
    session.setOrientation = sinon.stub().named('setOrientation').resolves('default-orientation');
    session.takeScreenshot = sinon.stub().named('takeScreenshot').resolves('default-base64');
    session.extendOptions = sinon.stub().named('extendOptions').resolves();
    session.$ = sinon.stub().named('$').resolves(element);
    session.getOrientation = sinon.stub().named('getOrientation').resolves('default-orientation');

    session.addCommand = sinon.stub().callsFake((name, command, isElement) => {
        const target = isElement ? element : session;

        target[name] = command.bind(target);
        sinon.spy(target, name);
    });

    session.overwriteCommand = sinon.stub().callsFake((name, command, isElement) => {
        const target = isElement ? element : session;

        target[name] = command.bind(target, target[name]);
        sinon.spy(target, name);
    });

    session.desiredCapabilities = Object.assign({version: '13.0'}, desiredCapabilities);

    return session;
};
