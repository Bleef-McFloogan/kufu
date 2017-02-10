/** Kufu - A browser extension for time management and productivity tracking. */
var Kufu = (Kufu === undefined) ? (function() {

    /** Used to make sure the 1-minute alarm system can only be started once. */
    var KUFU_STARTED = false;

    /** Used to make sure that a timestamp is only set once per minute. */
    var LAST_TIMESTAMP = moment(moment.now());

    /**
     * The percentage that a piece of the pie must be for it not to be counted
     * as "Other".
     */
    var OTHER_THRESHOLD = 0.05;

    /** Working copy of the user's data. */
    var userData = {};

    /** Start all of the required services. */
    function start() {
        if (!KUFU_STARTED) {
            console.log("Starting Kufu!");
            tryLoadUserData();
            startClock();
            KUFU_STARTED = true;
        }
    }

    /** Gets called every minute. */
    function updateStats() {
        var t, i, diff;
        chrome.tabs.query({
            active: true
        }, handleActiveTabs);
        for (var key in userData) {
            userData[key].minsInLastHour = 0;
            userData[key].minsInLastDay = 0;
            userData[key].minsInLastWeek = 0;
            userData[key].minsInLastMonth = 0;
            userData[key].minsInLastYear = 0;
            for (i = 0; i < userData[key].timestamps.length; i++) {
                t = moment(userData[key].timestamps[i]);
                diff = Math.abs(t.diff(moment.now()) / 1000 / 60 / 60);
                if (diff < 1)
                    userData[key].minsInLastHour++;
                if (diff /= 24 < 1)
                    userData[key].minsInLastDay++;
                if (diff / 7 < 1)
                    userData[key].minsInLastWeek++;
                if (diff / 30.5 < 1) // FIXME?
                    userData[key].minsInLastMonth++;
                if (diff / 365 < 1) // FIXME?
                    userData[key].minsInLastYear++;
            }
        }
        storeData();
    }

    // Persists the local user data to storage.
    function storeData() {
        chrome.storage.local.set({
            Kufu_UserData: userData
        }, function() {
            var error = chrome.runtime.lastError;
            if (error) {
                console.error(error);
            }
        });
    }

    /**
     * Try to load the user's data. If they don't have any, returns an empty
     * array.
     */
    function tryLoadUserData(callback) {
        chrome.storage.local.get("Kufu_UserData", function(items) {
            var error = chrome.runtime.lastError;
            if (error) {
                console.error(error);
            } else {
                if (items.hasOwnProperty("Kufu_UserData")) {
                    userData = items.Kufu_UserData;
                    updateStats();
                    if (typeof callback === "function") {

                        // TODO: Move the below to the calling area. This 
                        // should be more generic.

                        // Convert the data to the format needed by the D3
                        // graph.
                        var newData = [];
                        for (var i in userData) {
                            newData.push({
                                label: i + " (" + userData[i].minsInLastHour +
                                        " mins)",
                                value: userData[i].minsInLastHour
                            });
                        }
                        newData = groupSmallValuesToOther(newData);
                        callback(newData);
                    }
                } else {
                    userData = {};
                }
            }
        });
    }

    /** Start the timer to update the stats every n seconds. */
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
    function handleActiveTabs(tabs) {
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
            if (win.focused && win.state !== "minimized") {
                updateTrackingValue(tab.title);
            } else {
                console.log("Not updating because window " + tab.windowId +
                        " is not focused or is minimized.");
            }
        });
    }

    /**
     * Updates the tracking value of a page by one.
     * @param {String} key - The key of the page's entry in storage.
     */
    function updateTrackingValue(key) {
        if (LAST_TIMESTAMP.isBefore(moment.now() + 1, 'minute')) {
            LAST_TIMESTAMP = moment(moment.now());
            console.log(moment(moment.now()).format("h:mm") +
                    " - Timestamping " + key);
            if (userData.hasOwnProperty(key)) {
                userData[key].timestamps.push(moment.now());
                userData[key].lastUpdated = moment.now();
                userData[key].minsInAllTime++;
            } else {
                userData[key] = {
                    minsInLastHour: 1,
                    minsInLastDay: 1,
                    minsInLastWeek: 1,
                    minsInLastMonth: 1,
                    minsInLastYear: 1,
                    minsInAllTime: 1,
                    timestamps: [moment.now()],
                    lastUpdated: moment.now()
                }
            }
            storeData();
        } else {
            console.warn("Not updating due to having been updated less than " +
                            "a minute ago.");
        }
    }

    /**
     * Calculate the items with values that are below some percentage threshold
     * and combine them into one object with a value equal to the sum of their
     * individual values.
     * @param {Object[]} data - The data to group the small items for.
     */
    function groupSmallValuesToOther(data) {
        var newData = [];
        var otherSum = 0;
        var sum = 0;
        for (var i = 0; i < data.length; i++){
            sum += data[i].value;
        }
        if (sum > 0) {
            for (i = 0; i < data.length; i++){
                console.log("Comparing " + data[i].value + " / " + sum + " = " +
                        (data[i].value / sum).toFixed(3));
                if (data[i].value / sum > OTHER_THRESHOLD) {
                    newData.push(data[i]);
                } else {
                    otherSum += data[i].value;
                }
            }
            newData.push({
                label: "Other (" + otherSum + " mins)",
                value: otherSum
            });
        }
        return newData;
    }

    /**
     * Sets the "Others" threshold percentage.
     * @param {Integer} n - The percentage as an integer.
     */
    function setOtherThreshold(n) {
        var val;

        if (typeof n === "string") {
            try {
                val = parseInt(n);
            } catch (err) {
                val = 5;
            }
        } else if (typeof n !== "number") {
            val = 5; 
        }
        if (n < 0) {
            val = 0;
        } else if (n > 100) {
            val = 100;
        }
        OTHER_THRESHOLD = val / 100;
        console.log("Set threshold to " + OTHER_THRESHOLD);
    }

    /**
     * Prints the contents of the database to the console. Used for debugging.
     */
    function printDatabase() {
        chrome.storage.local.get("Kufu_UserData", function(items) {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
            } else {
                if (items.hasOwnProperty("Kufu_UserData")) {
                    console.log("Printing Database:");
                    console.dir(items.Kufu_UserData);
                } else {
                    console.warn("No entry in database called Kufu_UserData.");
                }
            }
        });
    }

    return {
        start: start,
        tryLoadUserData: tryLoadUserData,
        updateStats: updateStats,
        setOtherThreshold: setOtherThreshold,
        printDatabase: printDatabase
    };
}()) : Kufu;
