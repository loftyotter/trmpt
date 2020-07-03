(function() {
    var isEnabled;

    function saveSettings(isEnabled) {
        browser.storage.local.set({
            enabled: isEnabled
        });
    }

    function loadDefaults() {
        fetch(chrome.runtime.getURL('../wordlists/default.json'))
            .then((response) => response.json())
            .then((json) => browser.storage.local.set({enabled: true, data: json}));
    }

    function loadSettings() {
        let storageItem = browser.storage.local.get();
        storageItem.then((res) => {
            isEnabled = res.enabled;

            if (res.enabled === undefined) {
                isEnabled = true;
                saveSettings(isEnabled);
            }
            if (res.data === undefined) {
                loadDefaults();
            }

            document.getElementById('enabled').checked = isEnabled;
        });
    }

    function clickDonate() {
        browser.tabs.create({"url": "/donate.html"});
    }

    function clickEnable() {
        isEnabled = !isEnabled;
        saveSettings(isEnabled);

        document.getElementById('message').classList.remove('hidden');
        // browser.runtime.sendMessage({"enabled": isEnabled});
    }

    function clickOptions() {
        browser.runtime.openOptionsPage();
    }

    document.getElementById('enabled').addEventListener('click', clickEnable);
    document.getElementById('options').addEventListener('click', clickOptions);
    document.getElementById('donate').addEventListener('click', clickDonate);
    document.addEventListener('DOMContentLoaded', loadSettings);
})();
