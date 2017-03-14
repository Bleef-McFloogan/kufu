function updateChart() {
    Kufu.tryLoadUserData(function(data) {
        KufuGraph.setGraphData(data);
    });
}

updateChart();

function centerChart() {
    var g = KufuGraph.getSvg()[0][0];
    g.style.visibility = "hidden";
    g.removeAttribute("transform");
    var svg = g.parentElement;
    svg.style.opacity = 0;
    setTimeout(function() {
        g.style.visibility = "visible";
        svg = g.parentElement;
        var bb = g.getBBox();
        var thatWidth = g.getClientRects()[0].right -
                svg.getClientRects()[0].left;
        var finalMargin = window.innerWidth / 2 - (bb.width - thatWidth);
        var width = parseInt(bb.width / 2 + 15);
        var height = parseInt(bb.height / 2 + 15);
        svg.style.width = bb.width + 30;
        svg.style.height = bb.height + 30;
        svg.style.marginLeft = finalMargin;
        svg.style.opacity = 1;
        g.setAttribute("transform", "translate(" + (bb.width - thatWidth) +
                ", " + height + ")");
        $("#placeholder_text").hide()
    }, 1000);
}

centerChart();

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

var eraseDataBtn = document.getElementById("erase-data-btn");
eraseDataBtn.addEventListener("click", Kufu.eraseData);
