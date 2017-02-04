/**
 * Kufu - A browser extension for time management and productivity tracking.
 */
var Kufu = (function() {

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
            }
        });
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


    return {
        updateActiveItems: updateActiveItems
    };
}());
    