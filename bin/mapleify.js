(function main($process) {

    "use strict";

    var vulcan = require('vulcanize'),
        path   = require('path'),
        fs     = require('fs'),
        jsDom  = require('jsdom'),
        argv   = require('minimist')(process.argv.slice(2));

    if (!argv.i) {
        throwError('Specify an input file, e.g: mapleify -i index.html').andTerminate();
    }

    var input  = path.resolve(argv.i),
        output = path.resolve(argv.o || 'mapleified.html');

    /**
     * @method throwError
     * @param {String} message
     * @return {Object}
     */
    function throwError(message) {

        var PrettyError = require('pretty-error'),
            pe          = new PrettyError(),
            rendered    = pe.render(new Error(message));

        console.log(rendered);

        return {

            /**
             * @method andTerminate
             * @return {void}
             */
            andTerminate: function andTerminate() {
                $process.exit(1);
            }

        }

    }

    /**
     * @method loadDocuments
     * @return {Promise[]}
     */
    function loadDocuments() {

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
     * @method toArray
     * @param {Object} arrayLike
     * @return {Array}
     */
    function toArray(arrayLike) {
        return Array.prototype.slice.apply(arrayLike);
    }

    vulcan.setOptions({ input: input, output: output }, function setOptions(error) {

        if (error) {
            throwError(error).andTerminate();
        }

        vulcan.processDocument(output);

        Promise.all(loadDocuments()).then(function then(documents) {

            var documentInput  = documents[0],
                documentOutput = documents[1];

            var correspondingElements = toArray(documentInput.querySelectorAll('link[rel="import"],template')),
                templateElements      = toArray(documentOutput.querySelectorAll('template'));

            templateElements.forEach(function forEach(templateElement, index) {

                var element = correspondingElements[index];

                if (element.nodeName.toLowerCase() === 'template') {
                    return;
                }

                var componentPath = element.getAttribute('href').split('/').slice(0, -1).join('/');
                templateElement.setAttribute('ref', componentPath);

            });

            fs.writeFileSync(output, documentOutput.documentElement.innerHTML);
            $process.exit(0);

        });

    });

})(process);