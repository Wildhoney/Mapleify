(function main($process) {

    "use strict";

    var vulcan = require('vulcanize'),
        path   = require('path'),
        fs     = require('fs'),
        jsDom  = require('jsdom');

    var input  = path.resolve('example/index.html'),
        output = path.resolve('example/mapleified.html');

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

    vulcan.setOptions({ input: input, output: output }, function setOptions(thrownError) {

        if (thrownError) {
            console.error(thrownError);
            $process.exit(1);
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