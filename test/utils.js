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

exports.mkBrowser_ = () => {
    const session = Promise.resolve();

    session.executionContext = {};
    session.url = sinon.stub().named('url').resolves();
    session.click = sinon.stub().named('click').resolves();
    session.touch = sinon.stub().named('touch').resolves();
    session.touchAction = sinon.stub().named('touchAction').resolves();
    session.getElementSize = sinon.stub().named('getElementSize').resolves({});
    session.getLocation = sinon.stub().named('getLocation').resolves({});
    session.context = sinon.stub().named('context').resolves({value: 'default-ctx'});
    session.contexts = sinon.stub().named('contexts').resolves({value: ['default-ctx-1', 'default-ctx-2']});
    session.execute = sinon.stub().named('execute').resolves();
    session.waitUntil = sinon.stub().named('waitUntil').resolves();
    session.isVisible = sinon.stub().named('isVisible').resolves();
    session.isExisting = sinon.stub().named('isExisting').resolves(false);
    session.orientation = sinon.stub().named('orientation').resolves({value: 'default-orientation'});
    session.screenshot = sinon.stub().named('screenshot').resolves({value: 'default-base64'});

    session.addCommand = sinon.stub().callsFake((name, command) => {
        session[name] = command;
        sinon.spy(session, name);
    });

    return session;
};
