Kufu.tryLoadUserData(function(data) {
    KufuGraph.setGraphData(data);
});

var g, svg;
var bb;

g = KufuGraph.svg[0][0];
svg = g.parentElement;
svg.style.opacity = 0;

setTimeout(function() {
    g = KufuGraph.svg[0][0];
    svg = g.parentElement;
    bb = g.getBBox();
    var thatWidth = g.getClientRects()[0].right - svg.getClientRects()[0].left;
    var finalMargin = window.innerWidth / 2 - (bb.width - thatWidth);
    var width = parseInt(bb.width / 2);
    var height = parseInt(bb.height / 2);
    svg.style.width = bb.width;
    svg.style.height = bb.height;
    svg.style.marginLeft = finalMargin;
    svg.style.opacity = 1;
    g.setAttribute("transform", "translate(" + (bb.width - thatWidth) + ", " + height + ")");
}, 1000);
