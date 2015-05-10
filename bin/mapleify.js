#!/usr/bin/env node

(function main($process, $console) {

    "use strict";

    var vulcan = require('vulcanize'),
        path   = require('path'),
        fs     = require('fs'),
        jsDom  = require('jsdom'),
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
         * @method jsx
         * @param {HTMLTemplateElement} templateElement
         * @return {void}
         */
        jsx: function jsx(templateElement) {

            var jsxFiles = toArray(templateElement.querySelectorAll('script[type="text/jsx"]'));

            jsxFiles.forEach(function forEach(jsxFile) {
                jsxFile.setAttribute('type', 'text/javascript');
                jsxFile.setAttribute('src', jsxFile.getAttribute('src').replace(/x$/i, ''));
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

                vulcan.setOptions({ input: input, output: output }, function setOptions(error) {

                    if (error) {
                        throwError(error).andTerminate();
                    }

                    vulcan.processDocument(output);

                    Promise.all(loadDocuments(input, output)).then(function then(documents) {

                        var documentInput  = documents[0],
                            documentOutput = documents[1];

                        var correspondingElements = toArray(documentInput.querySelectorAll('link[rel="import"]:not([data-ignore]),template')),
                            templateElements      = toArray(documentOutput.querySelectorAll('template'));

                        templateElements.forEach(function forEach(templateElement, index) {

                            var element = correspondingElements[index];

                            transformations.jsx(templateElement);

                            if (element.nodeName.toLowerCase() === 'template') {
                                return;
                            }

                            var componentPath = element.getAttribute('href').split('/').slice(0, -1).join('/');
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