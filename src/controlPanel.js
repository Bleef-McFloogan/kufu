var submit = document.getElementById("other-percentage-submit");
var thresholdInput = document.getElementById("other-percentage");
submit.addEventListener('click', function(evt) {
    Kufu.setOtherThreshold(thresholdInput.value || 5);
    updateChart();
    centerChart();
});

var MENU_TOGGLE = true;
var cPanel = document.getElementById("control-panel");
var cPanelBtn = document.getElementById("control-panel-toggle-btn");
cPanelBtn.addEventListener("click", function() {
    if (MENU_TOGGLE) {
        this.classList.add("control-panel-toggle-btn-active");
        cPanel.classList.remove("animate-controller-expand-reverse");
        cPanel.classList.add("animate-controller-expand");
    } else {
        this.classList.remove("control-panel-toggle-btn-active");
        cPanel.classList.remove("animate-controller-expand");
        cPanel.classList.add("animate-controller-expand-reverse");
    }
    MENU_TOGGLE = !MENU_TOGGLE;
});