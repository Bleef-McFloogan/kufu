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
        var thatWidth = g.getClientRects()[0].right - svg.getClientRects()[0].left;
        var finalMargin = window.innerWidth / 2 - (bb.width - thatWidth);
        var width = parseInt(bb.width / 2 + 15);
        var height = parseInt(bb.height / 2 + 15);
        svg.style.width = bb.width + 30;
        svg.style.height = bb.height + 30;
        svg.style.marginLeft = finalMargin;
        svg.style.opacity = 1;
        g.setAttribute("transform", "translate(" + (bb.width - thatWidth) + ", " + height + ")");
    }, 1000);
}

centerChart();

// Add control logic.
var submit = document.getElementById("controlPanelSubmit");
var thresholdInput = document.getElementById("otherPercentage");
submit.addEventListener('click', function(evt) {
    Kufu.setOtherThreshold(thresholdInput.value || 5);
    updateChart();
    centerChart();
});