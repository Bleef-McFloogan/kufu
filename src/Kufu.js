/** Kufu - A browser extension for time management and productivity tracking. */
var Kufu = (Kufu === undefined) ? (function() {

    /** Used to make sure the 1-minute alarm system can only be started once. */
    var KUFU_STARTED = false;

    /** Used to make sure that a timestamp is only set once per minute. */
    var LAST_TIMESTAMP = moment(moment.now());

    /** The timeline for which to display the results. */
    var TIMELINE = "Hour";

    /** The allowed event listener names. */
    var EVENTS = ["dataChange"];
    var EVENT_LISTENERS = {
        dataChange: []
    };

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
        timelineElm = document.getElementById("timeline");
        if (timelineElm && timelineElm.value) {
            TIMELINE = timelineElm.value;
        }
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
                if (diff / 24 < 1)
                    userData[key].minsInLastDay++;
                diff = diff / 24;
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
    function tryLoadUserData() {
        chrome.storage.local.get("Kufu_UserData", function(items) {
            var error = chrome.runtime.lastError;
            if (error) {
                console.error(error);
            } else {
                if (items.hasOwnProperty("Kufu_UserData")) {
                    userData = items.Kufu_UserData;
                    updateStats();
                    triggerEvent("dataChange");
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
            triggerEvent("dataChange");
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
                if (data[i].value / sum > OTHER_THRESHOLD) {
                    newData.push(data[i]);
                } else {
                    otherSum += data[i].value;
                }
            }
            newData.push({
                label: "Other (" + getPrettyTime(otherSum) + ")",
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

    /** Erases all of the Kufu data in the database. */
    function eraseData() {
        if (confirm("Are you sure you want to delete all of your stored data?" +
                    " This cannot be undone."))
        {
            chrome.storage.local.remove("Kufu_UserData", function() {
                var error = chrome.runtime.lastError;
                if (error) {
                    console.error(error);
                } else {
                    alert("Successfully cleared stored data.");
                    userData = {};
                }
            });
        }
    }

    /*
     * Make sure that every page running Kufu will delete their local copies of
     * the data if the user tries to erase their stored data.
     */
    chrome.storage.onChanged.addListener(function(changes) {
        if (changes.hasOwnProperty("Kufu_UserData")) {
            userData = changes.Kufu_UserData.newValue || {};
        }
    });

    /**
     * @param {Number} Some number of minutes.
     * @returns A human-readable time value for the given number of minutes.
     */
    function getPrettyTime(mins) {
        var minsInDay = 60 * 24;
        var minsInWeek = minsInDay * 7;
        var minsInMonth = minsInDay * 30.5;
        var minsInYear = minsInMonth * 12;
        var years = 0;
        var months = 0;
        var weeks = 0;
        var days = 0;
        var hours = 0;
        var msg = "";
        while (mins > minsInYear) {
            years++;
            mins -= minsInYear;
        }
        while (mins > minsInMonth) {
            months++;
            mins -= minsInMonth;
        }
        while (mins > minsInWeek) {
            weeks++;
            mins -= minsInWeek;
        }
        while (mins > minsInDay) {
            days++;
            mins -= minsInDay;
        }
        while (mins > 60) {
            hours++;
            mins -= 60;
        }
        if (years > 0) {
            msg += years + (years === 1 ? " year, " : " years, ");
        }
        if (months > 0) {
            msg += months + (months === 1 ? " month, " : " months, ");
        }
        if (weeks > 0) {
            msg += weeks + (weeks === 1 ? " week, " : " weeks, ");
        }
        if (days > 0) {
            msg += days + (days === 1 ? " day, " : " days, ");
        }
        if (hours > 0) {
            msg += hours + (hours === 1 ? " hour, " : " hours, ");
        }
        msg += mins + (mins === 1 ? " min" : " mins");
        return msg;
    }

    /**
     * @returns The user's data in a format suited to graphing. The format is as
     * follows:
     * [{
     *     {String} label,
     *     {Number} value
     * }]
     */
    function getData() {
        var newData = [];
        var time, datum;
        for (var i in userData) {
            datum = userData[i]["minsInLast" + TIMELINE];
            time = getPrettyTime(datum);
            newData.push({
                label: i + " (" + time + ")",
                value: datum
            });
        }
        newData = groupSmallValuesToOther(newData);
        return newData;
    }

    /**
     * Adds an event listener to Kufu. The available events are in EVENTS.
     * @param {String} eventName - The name of the event
     * @param {Function} listener - The function to be called when the event is
     * triggered.
     */
    function addEventListener(eventName, listener) {
        if (typeof eventName !== "string") {
            throw new Error("First argument must be a string!");
            return;
        }
        if (typeof listener !== "function") {
            throw new Error("Second argument must be a function!");
            return;
        }
        if (EVENTS.indexOf(eventName) === -1) {
            var msg = eventName + " is not a valid event name!" +
                    " Possible event names are: ";
            for (var i = 0; i < EVENTS.length; i++) {
                if (i === EVENTS.length - 1) {
                    msg += EVENTS[i];
                } else {
                    msg += EVENTS[i] + ", ";
                }
            }
            throw new Error(msg);
        } else {
            EVENT_LISTENERS[eventName].push(listener);
        }
    }

    /**
     * Call all of the event listeners for the given event.
     * @param {String} eventName - The name of the event to call the listeners
     * for.
     */
    function triggerEvent(eventName) {
        console.log("Event " + eventName + " triggered.");
        if (typeof eventName !== "string") {
            throw new Error("First argument must be a string!");
            return;
        }
        if (EVENTS.indexOf(eventName) === -1) {
            var msg = eventName + " is not a valid event name!" +
                    " Possible event names are: ";
            for (var i = 0; i < EVENTS.length; i++) {
                if (i === EVENTS.length - 1) {
                    msg += EVENTS[i];
                } else {
                    msg += EVENTS[i] + ", ";
                }
            }
            throw new Error(msg);
        } else {
            for (var i = 0; i < EVENT_LISTENERS[eventName].length; i++) {
                EVENT_LISTENERS[eventName][i]();
            }
        }
    }

    return {
        start: start,
        tryLoadUserData: tryLoadUserData,
        updateStats: updateStats,
        setOtherThreshold: setOtherThreshold,
        printDatabase: printDatabase,
        eraseData: eraseData,
        getData: getData,
        addEventListener: addEventListener
    };
}()) : Kufu;
