'use strict';

const _ = require('lodash');
const configParser = require('gemini-configparser');
const defaults = require('./defaults');

const thr = (str) => {
    throw new TypeError(str);
};

const {root, map, section, option} = configParser;

const ENV_PREFIX = 'testplane_safari_commands_';
const CLI_PREFIX = '--testplane-safari-commands-';

const assertType = (name, validationFn, type) => {
    return (v) => !validationFn(v) && thr(`"${name}" option must be ${type}, but got ${typeof v}`);
};

const assertBoolean = (name) => assertType(name, _.isBoolean, 'boolean');
const assertArrayOfStrings = (value, name) => {
    if (!(_.isArray(value) && value.every(_.isString))) {
        throw new Error(`"${name}" must be an array of strings but got ${JSON.stringify(value)}`);
    }
};
const assertNumberProperty = (value, prop, propPath) => {
    if (!_.isNumber(value[prop])) {
        throw new Error(`Property "${propPath}.${prop}" must be a number but got ${value[prop] === null ? 'null' : typeof value[prop]}`);
    }
};

const getParser = () => {
    return root(section({
        enabled: option({
            defaultValue: defaults.enabled,
            parseEnv: JSON.parse,
            parseCli: JSON.parse,
            validate: assertBoolean('enabled')
        }),
        browsers: map(section({
            commands: option({
                defaultValue: defaults.commands,
                parseEnv: JSON.parse,
                parseCli: JSON.parse,
                validate: (value) => {
                    _.isNull(value)
                        ? thr('Each browser must have "commands" option')
                        : assertArrayOfStrings(value, 'commands');
                }
            }),
            nativeElementsSize: option({
                defaultValue: defaults.nativeElementsSize,
                parseEnv: JSON.parse,
                parseCli: JSON.parse,
                validate: (value) => {
                    if (_.isNull(value)) {
                        return;
                    }

                    if (!_.isPlainObject(value)) {
                        throw new Error('"nativeElementsSize" must be an object');
                    }
                    const valueProps = _.keys(value);

                    const requiredProps = ['topToolbar', 'bottomToolbar', 'webview'];
                    const missingProps = requiredProps.filter(prop => !valueProps.includes(prop));

                    if (missingProps.length) {
                        throw new Error(
                            `"nativeElementsSize" missing properties: ${missingProps}.`
                        );
                    }

                    _.forOwn(value, (size, key) => {
                        if (!_.isPlainObject(size)) {
                            throw new Error(`Property "${key}" of "nativeElementsSize" must be an object`);
                        }

                        assertNumberProperty(size, 'width', `nativeElementsSize.${key}`);
                        assertNumberProperty(size, 'height', `nativeElementsSize.${key}`);
                    });

                    const allowedProps = [...requiredProps];
                    const unknownProps = valueProps.filter(prop => !allowedProps.includes(prop));

                    if (unknownProps.length) {
                        throw new Error(
                            `"nativeElementsSize" contains unknown properties: ${unknownProps}. Allowed: ${allowedProps}.`
                        );
                    }
                }
            })
        }))
    }), {envPrefix: ENV_PREFIX, cliPrefix: CLI_PREFIX});
};

module.exports = (options) => {
    const {env, argv} = process;

    return getParser()({options, env, argv});
};
