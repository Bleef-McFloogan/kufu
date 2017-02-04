/**
 * Kufu - A browser extension for time management and productivity tracking.
 */
var Kufu = (function() {
    var USER_DATA_LOADED = false;

    /**
     * Working copy of the user's data.
     */
    var userData = {};

    /**
     * Start all of the required services.
     */
    function start() {
        tryLoadUserData();
        startClock();
    }

    /**
     * Gets called every minute.
     */
    function updateStats() {
        chrome.tabs.query({
            active: true
        }, handleTabs);
        updateTrackingView();
    }

    /**
     * Try to load the user's data. If they don't have any, returns an empty
     * array.
     */
    function tryLoadUserData() {
        chrome.storage.sync.get("Kufu_UserData", function(items) {
            if (chrome.runtime.lastError) {
                console.error("Shit's on fire, yo");
            } else {
                // TODO
                console.log("Loaded previous user data.");
                console.dir(items.Kufu_UserData);
                userData = items.Kufu_UserData;
                USER_DATA_LOADED = true;
                updateTrackingView();
            }
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
            checkWindow(tabs[i]);
        }
    }

    /**
     * Checks if a window is not minimized and if it is it adds the active tab
     * to the list.
     * @param {Object} tab - The tab whose window is being checked.
     */
    function checkWindow(tab) {
        chrome.windows.get(tab.windowId, function(win) {
            if (win.state !== "minimized") {
                updateTrackingValue(tab.title);
            }
        });
    }

    /**
     * Updates the tracking value of a page by one.
     * @param {String} title - The title of the page.
     */
    function updateTrackingValue(title) {
        if (USER_DATA_LOADED) {
            if (
                typeof userData === "object" &&
                typeof userData[title] === "object"
            ) {
                userData[title].time++;
            } else {
                userData[title] = {
                    time: 1
                }
            }
            chrome.storage.sync.set({
                Kufu_UserData: userData
            });
        }
    }

    /**
     * Update the view for the data.
     */
    function updateTrackingView() {
        console.log("Updating tracking view.");
        console.dir(userData);
        for (var i in userData) {
            console.log(i);

            // Create the <li> element.
            var li = document.createElement('li');
            li.innerText = i + " - " + userData[i].time;

            // Append it to active tabs list.
            var ul = document.getElementById('activeTabs');
            ul.appendChild(li);
        }
    }

    return {
        start: start
    };
}());
    