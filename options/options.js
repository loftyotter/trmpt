(function() {
    function cartesian() {
        var r = 1;
        for (var i = 0; i < arguments.length; i++) {
            r *= arguments[i].length;
        }
        return r;
    }

    function isValidJson(str) {
        try {
            let json = JSON.parse(str);
            if (!json.hasOwnProperty('replacer')) { return false }
            if (!json.hasOwnProperty('given')) { return false }
            if (!json.hasOwnProperty('middle')) { return false }
            if (!json.hasOwnProperty('surname_adj')) { return false }
            if (!json.hasOwnProperty('surname_noun')) { return false }
        } catch (e) {
            return false;
        }
        return true;
    }

    function loadDefaults() {
        fetch(chrome.runtime.getURL('../wordlists/default.json'))
            .then((response) => response.json())
            .then((json) => {
                browser.storage.local.set({enabled: true, data: json})
                updatePage(json)
            });
    }

    function loadSettings() {
        let storageItem = browser.storage.local.get();
        storageItem.then((res) => {
            if (res.data === undefined) {
                loadDefaults();
            }
            updatePage(res.data);
        });
    }

    function saveSettings(e) {
        if (isValidJson(document.getElementById('trmpt').value)) {
            let jsonObj = JSON.parse(document.getElementById('trmpt').value);

            browser.storage.local.set({
                data: jsonObj
            });

            document.getElementById('message').innerText = 'Saved!';
            document.getElementById('message').classList.remove('hidden');
            updatePage(jsonObj);
        } else {
            document.getElementById('message').innerText = 'Invalid json! Nothing was saved.';
            document.getElementById('message').classList.remove('hidden');
        }
    }

    function updatePage(res) {
        try {
            let loadedRules = res.replacer.length;
            let loadedPerms = cartesian(res.given, res.middle, res.surname_adj, res.surname_noun);
    
            document.getElementById('loaded_phrases').textContent = loadedRules;
            document.getElementById('loaded_variations').textContent = loadedPerms;
            document.getElementById('trmpt').value = JSON.stringify(res, null, 2);
        } catch (e) {
            document.getElementById('loaded_phrases').textContent = 0;
            document.getElementById('loaded_variations').textContent = 0;
        }
    }

    function receivedToggle(message) {
        if (message.enabled) {
            loadSettings();
        } else {
            turnOff()
        }
    }

    function turnOff() {
        document.getElementById('loaded_phrases').textContent = 0;
        document.getElementById('loaded_variations').textContent = 0;
    }

    function clickWordlistDefault() {
        fetch(chrome.runtime.getURL('../wordlists/default.json'))
            .then((response) => response.json())
            .then((json) => document.getElementById('trmpt').value = JSON.stringify(json, null, 2));
    }

    document.addEventListener('DOMContentLoaded', loadSettings);
    document.getElementById('save').addEventListener('click', saveSettings);
    document.getElementById('wordlist_default').addEventListener('click', clickWordlistDefault);
    // browser.runtime.onMessage.addListener(receivedToggle);
})();
