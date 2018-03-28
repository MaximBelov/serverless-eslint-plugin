'use strict';

const _ = require('lodash'),
    path = require('path'),
    Promise = require('bluebird'),
    chalk = require('chalk'),
    CLIEngine = require("eslint").CLIEngine,
    util = require('util');

class ServerlessESLint {
    constructor(serverless, options) {

        this.options = options;
        this.serverless = serverless;
        this.SCli = serverless.cli;
        this.SError = serverless.classes.Error;
        this.log = serverless.cli.log.bind(serverless.cli);

        this.commands = {
            eslint: {
                usage: 'Detects errors and potential problems in your Lambda function',
                lifecycleEvents: [
                    'functions'
                ],
                options: {
                    function: {
                        usage: 'Specify the function you want to check (e.g. "-f myFunction")',
                        shortcut: 'f',
                         // required: true
                    }
                }
            },
        };

        this.hooks = {
            'eslint:functions': this.functionESLint.bind(this),
            'before:offline:start:init': this.functionESLint.bind(this),
            'webpack:compile:watch:compile':this.functionESLint.bind(this),
            'before:package:createDeploymentArtifacts':this.functionESLint.bind(this)
        };

    }

    functionESLint() {
        return this._validateAndPrepare(this)
            .then(func => {
                return this._lint(func)
                    .then(() => {
                        this.log(chalk.bold.green('Success! - No linting errors found.'));
                    })
                    .catch(err => {
                        this.log(chalk.bold.red('Error! - Linting errors found.'));
                        if (err && err.results) {
                            err.results.forEach(func => {
                                if (func.warningCount + func.errorCount > 0) {
                                    this.log(chalk.red(util.format("In file %s", func.filePath)));
                                    func.messages.forEach(error => {
                                        let type = error.severity === 1 ? "Warning" : "Error";
                                        this.log(chalk.red(util.format("%d:%d %s: %s", error.line, error.column, type, error.message)));
                                    });
                                }
                            });
                        }

                    });
            });
    }

    _validateAndPrepare(inst) {

        const names = inst.serverless.service.getAllFunctions();
        const SError = inst.SError;

        try {
            return Promise.resolve(_.map(names, name => {
                const func = inst.serverless.service.getFunction(name);
                if (!func){
                    throw new SError(`Function "${name}" doesn't exist in your project`);
                }
                if (!inst.serverless.service.provider.runtime.includes('nodejs')){
                    throw new SError('ESLint does not support runtimes other than "nodejs".');
                }
                return func;
            }));
        } catch (err) {
            return Promise.reject(err);
        }
    }

    _lint(functions) {

        const servicePath = this.serverless.config.servicePath;
        const configFile = servicePath + '/.eslintrc.json';

        const files = _.map(functions, func => {
            return func.handler.replace("handler", "js")
            // return func.getRootPath(func.handler.split('/').pop().split('.')[0] + '.js');
        });

        let cli = new CLIEngine({
            configFile: this.serverless.utils.fileExistsSync(configFile) ? configFile : ""
        });

        const result = cli.executeOnFiles(files);

        if (result.errorCount + result.warningCount > 0) {
            return Promise.reject(result);
        }

        return Promise.resolve();
    }

}

module.exports = ServerlessESLint;
