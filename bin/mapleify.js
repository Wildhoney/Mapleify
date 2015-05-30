#!/usr/bin/env node

(function main($process, $console) {

    "use strict";

    var vulcan = require('vulcanize'),
        path   = require('path'),
        fs     = require('fs'),
        jsDom  = require('jsdom'),
        assign = require('object-assign'),
        argv   = require('minimist')(process.argv.slice(2));

    // Determine if the module was required, or used from the terminal.
    var required = (require.main !== module);

    /**
     * @method throwError
     * @param {String} message
     * @return {Object}
     */
    function throwError(message) {

        if (required) {
            throw new Error(message);
        }

        var PrettyError = require('pretty-error'),
            pe          = new PrettyError(),
            rendered    = pe.render(new Error(message));

        $console.log(rendered);

        return {

            /**
             * @method andTerminate
             * @return {void}
             */
            andTerminate: function andTerminate() {
                $process.exit(1);
            }

        };

    }

    /**
     * @method nameSansExtension
     * @param {String} path
     * @return {String}
     */
    function nameSansExtension(path) {
        return path.split('.').slice(0, -1).join('.');
    }

    /**
     * @method toArray
     * @param {Object} arrayLike
     * @return {Array}
     */
    function toArray(arrayLike) {
        return Array.prototype.slice.apply(arrayLike);
    }

    /**
     * @method loadDocuments
     * @param {Object} input
     * @param {Object} output
     * @return {Promise[]}
     */
    function loadDocuments(input, output) {

        return [input, output].map(function map(filePath) {

            return new Promise(function Promise(resolve, reject) {

                var content = fs.readFileSync(filePath, 'utf8');

                jsDom.env(content, function processHtml(errors, window) {
                    resolve(window.document);
                });

            });

        });

    }

    /**
     * @property transformations
     * @type {Object}
     */
    var transformations = {

        /**
         * @method js
         * @param {HTMLTemplateElement} templateElement
         * @return {void}
         */
        js: function js(templateElement) {

            var jsFiles = toArray(templateElement.querySelectorAll('script'));

            jsFiles.forEach(function forEach(jsFile) {
                jsFile.setAttribute('type', 'text/javascript');
                jsFile.setAttribute('src', nameSansExtension(jsFile.getAttribute('src')) + '.js');
            });

        },

        /**
         * @method css
         * @param {HTMLTemplateElement} templateElement
         * @return {void}
         */
        css: function css(templateElement) {

            var jsFiles = toArray(templateElement.querySelectorAll('link'));

            jsFiles.forEach(function forEach(jsFile) {
                jsFile.setAttribute('type', 'text/css');
                jsFile.setAttribute('href', nameSansExtension(jsFile.getAttribute('href')) + '.css');
            });

        }

    };

    /**
     * @property mapleify
     * @type {Object}
     */
    var mapleify = module.exports = {

        /**
         * @method transform
         * @param input {String}
         * @param output {String}
         * @param options {Object}
         * @return {Promise}
         */
        transform: function transform(input, output, options) {

            if (!input) {
                throwError('Specify an input file, e.g: mapleify -i index.html').andTerminate();
            }

            return new Promise(function(resolve, reject) {

                var options = assign(options || {}, { input: input, output: output });

                vulcan.setOptions(options, function setOptions(error) {

                    if (error) {
                        throwError(error).andTerminate();
                    }

                    vulcan.processDocument(output);

                    Promise.all(loadDocuments(input, output)).then(function then(documents) {

                        var documentInput  = documents[0],
                            documentOutput = documents[1];

                        var correspondingElements = toArray(documentInput.querySelectorAll('link[rel="import"]:not([data-ignore]),template')),
                            templateElements      = toArray(documentOutput.querySelectorAll('template'));

                        var correspondingLength = correspondingElements.length,
                            templateLength      = templateElements.length;

                        if (correspondingLength !== templateLength) {
                            throwError('Mismatch between document templates: ' + correspondingLength + '/' + templateLength);
                            reject();
                        }

                        templateElements.forEach(function forEach(templateElement, index) {

                            var element = correspondingElements[index];

                            transformations.js(templateElement);
                            transformations.css(templateElement);

                            if (element.nodeName.toLowerCase() === 'template') {
                                return;
                            }

                            var componentPath = element.getAttribute('href').split('/').slice(0, -1).join('/');

                            if (element.hasAttribute('data-namespace')) {

                                // Transfer across the namespace if it is defined.
                                templateElement.setAttribute('data-namespace', element.getAttribute('data-namespace'));
                                
                            }


                            templateElement.setAttribute('ref', componentPath);

                        });

                        fs.writeFileSync(output, documentOutput.documentElement.outerHTML);
                        resolve({ output: documentOutput.documentElement.outerHTML });

                    });

                });

            });

        }

    };

    if (!required) {

        var input  = path.resolve(argv.i),
            output = path.resolve(argv.o || [path.dirname(input), 'mapleified.html'].join(path.sep));

        mapleify.transform(input, output);

    }

})(process, console);