/** Kufu - A browser extension for time management and productivity tracking. */
var Kufu = (Kufu === undefined) ? (function() {

    /** Used to make sure the 1-minute alarm system can only be started once. */
    var KUFU_STARTED = false;

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
            tryLoadUserData();
            startClock();
            KUFU_STARTED = true;
        }
    }

    /** Gets called every minute. */
    function updateStats() {
        chrome.tabs.query({
            active: true
        }, handleTabs);
    }

    /**
     * Try to load the user's data. If they don't have any, returns an empty
     * array.
     */
    function tryLoadUserData(callback) {
        chrome.storage.local.get("Kufu_UserData", function(items) {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
            } else {
                if (items.hasOwnProperty("Kufu_UserData")) {
                    userData = items.Kufu_UserData;

                    if (typeof callback === "function") {

                        // TODO: Move the below to the calling area. This 
                        // should be more generic.

                        // Convert the data to the format needed by the D3
                        // graph.
                        var newData = [];
                        for (var i in userData) {
                            if (Math.floor(userData[i].minsInLastHour < 60)) {
                                newData.push({
                                    label: i + " (" + "" + userData[i].minsInLastHour  + " mins" + ")",
                                    value: userData[i].minsInLastHour
                                });
                            } else {
                                newData.push({
                                    label: i + " (" + "" + Math.floor(userData[i].minsInLastHour/60) + " hrs " + ")" + userData[i].minsInLastHour%60 + " mins ",
                                    value: userData[i].minsInLastHour
                                });
                            }
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
                console.log(moment(moment.now()).format("h:mm") + " - Adding one minute to " + title);
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
        chrome.storage.local.set({
            Kufu_UserData: userData
        });
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

        for (i = 0; i < data.length; i++){
            console.log("Comparing " + data[i].value + " / " + sum + " = " + (data[i].value / sum).toFixed(3));
            if (data[i].value / sum > OTHER_THRESHOLD) {
                newData.push(data[i]);
            } else {
                otherSum += data[i].value;
            }
        }

        newData.push({
            label: "Other",
            value: otherSum
        });

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

        chrome.storage.local.get("Kufu_UserData", function(items) {
    return {
        start: start,
        tryLoadUserData: tryLoadUserData,
        updateStats: updateStats,
        setOtherThreshold: setOtherThreshold
    };
}()) : Kufu;
