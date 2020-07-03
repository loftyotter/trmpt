(function() {

    function loadDefaults() {
        fetch(chrome.runtime.getURL('../wordlists/default.json'))
            .then((response) => response.json())
            .then((json) => browser.storage.local.set({enabled: true, data: json}))
            .then((data) => loadJsonObj());
    }

    function isEnabled() {
        let storageItem = browser.storage.local.get('enabled');
        storageItem.then((res) => {
            if (res.enabled === undefined) {
                loadDefaults();
            } else if (res.enabled) {
                loadJsonObj();
            }
        });
    }

    function loadJsonObj() {
        let storageItem = browser.storage.local.get('data');
        storageItem.then((res) => {
            process(res.data);
        });
    }

    function process(obj) {
        const nameElements = getNameElements(obj);

        var nameMap = []
        obj.replacer.forEach(element => {
            nameMap.push([new RegExp(element.regex, 'i'), trumptIt(element.replacement, nameElements)]);
        });

        replaceText(document.body);
        replaceTitle(document.title);

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                    for (let i = 0; i < mutation.addedNodes.length; i++) {
                        const newNode = mutation.addedNodes[i];
                        replaceText(newNode);
                    }
                }
            });
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false,
        });

        /**
         * Returns a replacement name based on a type
         * @param {string} type
         * @param {string[]} nameElements
         * @returns {string}
         */
        function trumptIt(type, nameElements) {
            switch (type) {
                case 'short':
                    return nameElements[2] + " " + nameElements[3];
                case 'medium':
                    return nameElements[0] + ' ' + nameElements[2] + " " + nameElements[3];
                case 'full':
                    return nameElements[0] + " '" + nameElements[1] + "' " + nameElements[2] + " " + nameElements[3];
                case 'twitter':
                    return '@real' + nameElements[0] + nameElements[2] + nameElements[3];
                case 'instagram':
                    return 'real' + nameElements[0] + nameElements[2] + nameElements[3];
                default:
                    return nameElements[0] + ' ' + nameElements[2];
            }
        }

        /**
         * Adds spans containing replacement elements to a parent span
         * @param {Object} span
         * @param {string[]} results
         * @param {string} replacement
         * @param {string[]} nameElements
         */
        function processSpan(span, regex, replacement, nameElements) {
            const results = span.innerHTML.split(regex);
            span.textContent = '';

            for (let i = 0; i < results.length; i++) {
                if (results[i] != "") {

                    // Skip usage of innerHTML https://stackoverflow.com/a/60838160
                    const parser = new DOMParser();
                    const parsedBody = parser.parseFromString(results[i], 'text/html').body;

                    for (let i = 0; i <= parsedBody.childNodes.length; i++) {
                        const tag = parsedBody.childNodes[i];
                        if (!tag) continue;
                
                        if (tag instanceof Text) {
                            span.append(document.createTextNode(' ' + tag.textContent));
                        } else if (tag instanceof HTMLElement) {
                            span.appendChild(tag.cloneNode(true));
                        }
                    }
                }
                if (i < (results.length - 1)) {
                    let replacer = document.createElement('span');
                    replacer.setAttribute('class', 'trmpt');
                    replacer.innerText = replacement;
                    let replacertip = document.createElement('span');
                    replacertip.setAttribute('class', 'trmpttext');
                    replacertip.innerText = trumptIt('full', nameElements) + ' #trmpt';
                    replacer.appendChild(replacertip);

                    span.appendChild(replacer);
                }
            }
        }

        function recurse(i, nameArray, topSpan) {
            if (i < nameArray.length) {
                const regex = nameArray[i][0];
                const replacement = nameArray[i][1];

                // Check to see if nameArray[i] regex is in topSpan
                if (regex.test(topSpan.innerHTML)) {  // current iteration of regex found something
                    isFound = true;
                    processSpan(topSpan, regex, replacement, nameElements);
                }

                recurse(i + 1, nameArray, topSpan)
            }
        }

        /**
         * Replaces text across a DOM node
         * @param {Object}
         */
        function replaceText(node) {
            if (node.nodeType == Node.TEXT_NODE) {
                if (node.parentNode && node.parentNode.nodeName == 'TEXTAREA') {
                    return;
                }

                isFound = false;

                // Work all changes in a span separate from the DOM
                let topSpan = document.createElement('span');
                topSpan.textContent = node.textContent;
                recurse(0, nameMap, topSpan);

                if (isFound) {
                    if (node.parentNode) {
                        node.parentNode.insertBefore(topSpan, node);
                        node.parentNode.removeChild(node);
                    }
                }
            } else {
                for (let i = 0; i < node.childNodes.length; i++) {
                    replaceText(node.childNodes[i]);
                }
            }
        }

        function replaceTitle(title) {
            for (i = 0; i < nameMap.length; i++) {
                const regex = nameMap[i][0];
                const replacement = nameMap[i][1];

                if (regex.test(title)) {
                    document.title = title.replace(regex, replacement);
                    break;
                }
            }
        }
    }

    /**
     * Returns the name elements from the name lists
     * @param {Object.<string, string[]>} obj // TODO - check type
     * @returns {string[]}
     */
    function getNameElements(obj) {
        return [randomElement(obj.given), randomElement(obj.middle), randomElement(obj.surname_adj), randomElement(obj.surname_noun)];
    }

    /**
     * Returns a random element from an array
     * @param {string[]} array
     * @returns {string}
     */
    function randomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    isEnabled();
})();
