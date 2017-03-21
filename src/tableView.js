function populateTable(list) {
    for (var i = 0; i < list.length; i++) {
        var tr = document.createElement("tr");
        var nameElm = document.createElement("td");
        var valueElm = document.createElement("td");
        var table1 = document.getElementById("table1");
        nameElm.innerHTML = list[i].label;
        valueElm.innerHTML = list[i].value;
        tr.appendChild(nameElm);
        tr.appendChild(valueElm);
        table1.appendChild(tr);
    }
}

Kufu.tryLoadUserData(populateTable)