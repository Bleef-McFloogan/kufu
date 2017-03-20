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

var quotes = [
    {
        text: "“The perfect is the enemy of the good.” - Voltaire",
    },
    {
        text: "“The way to get started is to quit talking and begin doing.” – Walt Disney",
    },
    {
        text: "“It’s not that I’m so smart, it’s just that I stay with problems longer. – Albert Einstein",
    },
    {
        text: "“Sometimes, things may not go your way, but the effort should be there every single night.” – Michael Jordan",
    },
    {
        text: "“How poor are they that have not patience! What wound did ever heal but by degrees?” – William Shakespeare",
    },
    {
        text: "“Amateurs sit and wait for inspiration, the rest of us just get up and go to work.” - Stephen King",
    },
    {
        text: "“The mind is everything. What you think you become.” – Buddha",
    },
    {
        text: "“Either write something worth reading or do something worth writing.” - Benjamin Franklin",
    },
    {
        text: "“If you spend too much time thinking about a thing, you’ll never get it done.” - Bruce Lee",
    },
    {
        text: "“Action is the foundational key to all success.” - Pablo Picasso",
    },
    {
        text: "“Absorb what is useful, reject what is useless, add what is specifically your own.” - Bruce Lee",
    },
    {
        text: "“It is not the strongest of the species that survive, nor the most intelligent, but the one most responsive to change.” - Charles Darwin",
    },
    {
        text: "“There is no substitute for hard work.” - Thomas Edison",
    },
    {
        text: "“Success is a lousy teacher. It seduces smart people into thinking they can't lose.” - Bill Gates",
    }
];

var quote = quotes[Math.floor(Math.random() * quotes.length)];
document.getElementById("quote").innerHTML = '<p>' + quote.text + '</p>';
