function populateTable(list) {
    var table = document.getElementById("timeTableBody");
    table.innerHTML = "";
    for (var i = 0; i < list.length; i++) {
        var tr = document.createElement("tr");
        var nameElm = document.createElement("td");
        var valueElm = document.createElement("td");
        nameElm.innerHTML = list[i].label;
        valueElm.innerHTML = list[i].value;
        tr.appendChild(nameElm);
        tr.appendChild(valueElm);
        table.appendChild(tr);
    }
}

Kufu.addEventListener("dataChange", function() {
    populateTable(Kufu.getData());
});

Kufu.start();