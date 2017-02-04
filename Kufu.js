/**
 * Kufu - A browser extension for time management and productivity tracking.
 */
var Kufu = (function() {
    var USER_DATA_LOADED = false;

    /**
     * Working copy of the user's data.
     */
    var userData = {};

    // Track website and how long they're on for.

    /**
     * Start all of the required services.
     */
    function start() {
        tryLoadUserData();
        updateStats();
        startClock();
    }

    /**
     * Try to load the user's data. If they don't have any, returns an empty
     * array.
     */
    function tryLoadUserData() {
        chrome.storage.sync.get("Kufu_UserData", function(items) {
            // userData = items ? items.userData : {};
            USER_DATA_LOADED = true;
        });
    }

    /**
     * Start the timer to update the stats every n seconds.
     */
    function startClock() {
        chrome.alarms.onAlarm.addListener(updateStats);
        chrome.alarms.create("Kufu_Tracker", {
            periodInMinutes: 1
        });
    }

    /**
     * Given the active tabs, decides which ones are not in minimized windows
     * and puts them into the views.
     * @param {Tab[]} tabs - The Tab objects from the chrome API. 
     */
    function handleTabs(tabs) {
        for (var i = 0; i < tabs.length; i++) {
            checkWindow(tabs[i].windowId, tabs[i].title);        
        }
    }

    /**
     * Checks if a window is not minimized and if it is it adds the active tab
     * to the list.
     * @param {Integer} windowId - A window ID.
     * @param {String} title - The title of a tab.
     */
    function checkWindow(windowId, title) {
        chrome.windows.get(windowId, function(win) {
            if (win.state !== "minimized") {
                addActiveTabItem(title);
                updateTrackingValue(title);
            }
        });
    }

    /**
     * Updates the tracking value of a page by one.
     * @param {String} title - The title of the page.
     */
    function updateTrackingValue(title) {
        if (USER_DATA_LOADED) {
            if (typeof userData === "object" && userData[title] === "object") {
                userData[title].time++;
            } else {
                userData[title] = {
                    time: 1
                }
            }
            console.dir(userData);
            chrome.storage.sync.set({
                userData: userData
            });
        }
    }

    /**
     * Adds an active tab item to the HTML.
     * @param {String} title - The title of the tab.
     */
    function addActiveTabItem(title) {

        // Create the <li> element.
        var li = document.createElement('li');
        li.innerText = title;

        // Append it to active tabs list.
        var ul = document.getElementById('activeTabs');
        ul.appendChild(li);
    }

    /**
     * Updates the active tabs in the popup window.
     */
    function updateActiveItems() {
        chrome.tabs.query({
            active: true
        }, handleTabs);
    }

    /**
     * Gets called every minute.
     */
    function updateStats() {
        updateActiveItems();
    }

    return {
        start: start
    };
}());
    