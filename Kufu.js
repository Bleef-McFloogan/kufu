/**
 * Kufu - A browser extension for time management and productivity tracking.
 */
var Kufu = (Kufu === undefined) ? (function() {

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
    }

    /**
     * Try to load the user's data. If they don't have any, returns an empty
     * array.
     */
    function tryLoadUserData() {
        chrome.storage.sync.get("Kufu_UserData", function(items) {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
            } else {
                if (items.hasOwnProperty("Kufu_UserData")) {
                    userData = items.Kufu_UserData;
                    updateTrackingView();
                } else {
                    userData = {};
                }
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
        if (
            typeof userData === "object" &&
            typeof userData[title] === "object"
        ) {
            var lastUpdated = moment(userData[title].lastUpdated);

            if (lastUpdated.isBefore(moment.now(), 'minute')) {
                userData[title].minsInLastHour++;
                userData[title].minsInLastDay++;
                userData[title].minsInLastWeek++;
                userData[title].minsInLastMonth++;
                userData[title].minsInLastYear++;
                userData[title].minsInAllTime++;

                if (lastUpdated.isBefore(moment.now(), 'hour'))
                    userData[title].minsInLastHour = 1;
                if (lastUpdated.isBefore(moment.now(), 'day'))
                    userData[title].minsInLastDay = 1;
                if (lastUpdated.isBefore(moment.now(), 'week'))
                    userData[title].minsInLastWeek = 1;
                if (lastUpdated.isBefore(moment.now(), 'month'))
                    userData[title].minsInLastMonth = 1;
                if (lastUpdated.isBefore(moment.now(), 'year'))
                    userData[title].minsInLastYear = 1;

                userData[title].lastUpdated = moment.now();
            } else {
                console.log("Not updating due to having been updated less " +
                        "than a minute ago.");
            }
        } else {
            userData[title] = {
                minsInLastHour: 1,
                minsInLastDay: 1,
                minsInLastWeek: 1,
                minsInLastMonth: 1,
                minsInLastYear: 1,
                minsInAllTime: 1,
                lastUpdated: moment.now()
            }
        }
        chrome.storage.sync.set({
            Kufu_UserData: userData
        }, function() {
            updateTrackingView();
        });
    }

    /**
     * Update the view for the data.
     */
    function updateTrackingView() {
        for (var i in userData) {

            // Create the <li> element.
            var li = document.createElement('li');
            li.innerText = i + " - " + userData[i].minsInLastHour;

            // Append it to active tabs list.
            var ul = document.getElementById('activeTabs');
            ul.appendChild(li);
        }
    }

    return {
        start: start,
        tryLoadUserData: tryLoadUserData,
        updateStats: updateStats
    };
}()) : Kufu;
