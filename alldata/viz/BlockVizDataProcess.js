const speciesColors = {
        "FVn": "#F3D98A", "POm": "#CFA7F0", "POn": "#B989EA", "POpag": "#A66FE0",
        "PEtun": "#8CC9FF", "PEcorea": "#63B5FF", "PEsal": "#3EA0F2", "PTc": "#2D8BE0",
        "Bpearl": "#225EA8", "BPearl": "#225EA8", "PAb": "#F09A3E","PApp": "#F09A3E", "HEg": "#87C96B",
        "HEn": "#80C98B", "HUn": "#F1E4CC", "HUlcb": "#E3D0B2", "HU22": "#E3D0B2",
        "LE3790": "#E7D1B8", "LEm": "#D7B38C", "LEfr": "#BF8B5D", "LEn": "#A86F3F",
        "PCg": "#F0C94E", "PCme": "#F0C94E", "PSn": "#F08FB0", "PSme": "#F08FB0",
        "GLg": "#D9896B", "GLzam": "#C96D55"
};

function getSpeciesColor(species) { return speciesColors[species] || ""; }

var preorder = ['id', 'species', 'blockdate', 'formula', 'totalsubstrate', 'spawn', 'spawncode', 'Age', 'BE', 'harvest'];
var keeplast = ["harvest"];
var sums = ["harvest"];
var aggregated = { "harvest": 7 };
var calculatedfields = { "Age": { "substract": ["now", "blockdate"] }, "BE": { "divide": ["totalharvest", "totalsubstrate"] } };
var formulatosubstrate = {
        "formula": { "Pn2x7": { "totalsubstrate": "1850" }, "Pnx6": { "totalsubstrate": "1580" }, "Pn2x6": { "totalsubstrate": "1580" }, "Pn2×6": { "totalsubstrate": "1580" }, "Pn3x7": { "totalsubstrate": "1850" }, "Pcx7": { "totalsubstrate": "1850" }, "Beechx6 2600h2o": { "totalsubstrate": "1580" }, "Beechx6 3000h2o": { "totalsubstrate": "1580" }, "Pn2x5.5": { "totalsubstrate": "1450" }, "Pn3x6": { "totalsubstrate": "1580" }, "BPcx6 unicorn": { "totalsubstrate": "1580" }, "Ppx7": { "totalsubstrate": "1850" }, "aPpx7": { "totalsubstrate": "1850" }, "Pcx6": { "totalsubstrate": "1580" }, "Pn310x6": { "totalsubstrate": "1415" }, "Ppx6": { "totalsubstrate": "1580" }, "Ppx5.5": { "totalsubstrate": "1450" }, "bPpx5.5": { "totalsubstrate": "1450" }, "aPpx5.5": { "totalsubstrate": "1450" }, "Kx6": { "totalsubstrate": "1580" }, "SDx6": { "totalsubstrate": "1580" }, "bSDx6": { "totalsubstrate": "1580" }, "Oakx6": { "totalsubstrate": "1580" }, "SFtx6": { "totalsubstrate": "1580" }, "SFtx6plus": { "totalsubstrate": "1580" }, "bSFtx6": { "totalsubstrate": "1580" }, "bSFTx6": { "totalsubstrate": "1580" }, "PpBr20Sg10x5.5": { "totalsubstrate": "1450" }, "SFtBr20Sg10x6plus": { "totalsubstrate": "1580" }, "SFtSgx6plus": { "totalsubstrate": "1580" } }
}

// MOVED 'harvest' to be immediately after Age & BE. Tags will dynamically load AFTER this predefined list.
var preorder = ['id', 'species', 'blockdate', 'formula', 'totalsubstrate', 'spawn', 'spawncode', 'Age', 'BE', 'harvest'];
var keeplast = ["harvest"];
var sums = ["harvest"];
var aggregated = { "harvest": 7 };
var calculatedfields = { "Age": { "substract": ["now", "blockdate"] }, "BE": { "divide": ["totalharvest", "totalsubstrate"] } };
var formulatosubstrate = {
    "formula":
        {   "Pn2x7": { "totalsubstrate": "1850" },
            "Pnx6": { "totalsubstrate": "1580" },
            "Pn2x6": { "totalsubstrate": "1580" },
            "Pn2×6": { "totalsubstrate": "1580" }, // special x
            "Pn3x7": { "totalsubstrate": "1850" },
            "Pcx7": { "totalsubstrate": "1850" },
            "Beechx6 2600h2o": { "totalsubstrate": "1580" },
            "Beechx6 3000h2o": { "totalsubstrate": "1580" },
            "Pn2x5.5": { "totalsubstrate": "1450" },
            "Pn3x6": { "totalsubstrate": "1580" },
            "BPcx6 unicorn": { "totalsubstrate": "1580" },

            "Pcx7": { "totalsubstrate": "1850" },
            "Ppx7": { "totalsubstrate": "1850" },
            "aPpx7": { "totalsubstrate": "1850" },
            "Pcx6": { "totalsubstrate": "1580" },
            "Pn2x6": { "totalsubstrate": "1580" },
            "Pn3x6": { "totalsubstrate": "1580" },
            "Pn310x6": { "totalsubstrate": "1415" },
            "Ppx6": { "totalsubstrate": "1580" },
            "Ppx5.5": { "totalsubstrate": "1450" },
            "bPpx5.5": { "totalsubstrate": "1450" },
            "aPpx5.5": { "totalsubstrate": "1450" },
            "Kx6": { "totalsubstrate": "1580" },
            "SDx6": { "totalsubstrate": "1580" },
            "bSDx6": { "totalsubstrate": "1580" },
            "Oakx6": { "totalsubstrate": "1580" },
            "SFtx6": { "totalsubstrate": "1580" },
            "SFtx6plus": { "totalsubstrate": "1580" },
            "bSFtx6": { "totalsubstrate": "1580" },
            "bSFTx6": { "totalsubstrate": "1580" },
            "PpBr20Sg10x5.5": { "totalsubstrate": "1450" },
            "SFtBr20Sg10x6plus": { "totalsubstrate": "1580" },
            "SFtSgx6plus": { "totalsubstrate": "1580" },
        }
};

function removeConsecutiveDuplicates(td) {
        let lines = td.split('\n');
        let out = [];
        for (let i = 0; i < lines.length; i++) {
                if (i === 0 || lines[i] !== lines[i - 1]) {
                        out.push(lines[i]);
                }
        }
        return out.join('\n');
}

function dataLoaded(tdata) {
        geid("textcontent").value = tdata;

        setTimeout(() => {

                let ts = Date.now(), ts2;

                let tdata2 = removeCancels(tdata);

                ts2 = Date.now();
           //     console.log("removeCancels: " + (ts2-ts) + " ms");
                ts = ts2;

                let tdata3 = removeConsecutiveDuplicates(tdata2);

                ts2 = Date.now();
     //           console.log("removeConsecutiveDuplicates: " + (ts2-ts) + " ms");
                ts = ts2;

                buildBlockInfoIndex(tdata3);
                processData(tdata3);

                processData(tdata3);

        }, 10);
}

//let blockInfoIndex = {};
function buildBlockInfoIndex(tdata){
        blockInfoIndex = {};
        let lines = splitIntoLines(tdata);
        for(let line of lines){
                if(!line.trim())
                        continue;
                let fields = line.split(",");
                if(fields.length < 4)
                        continue;
                let id = fields[1].trim();
                if(!blockInfoIndex[id])
                        blockInfoIndex[id] = [];
                blockInfoIndex[id].unshift(line);
        }

}

function splitIntoLines(td) {
        let ntd = td.replaceAll("\r", "")
        return ntd.split("\n");
}

function splitLine(line) {
        let sub = line.split(",");
        if (sub.length != 4) {
                throw new Error("Line has more or less than 4 fields :"+line);
        }
        for (let n = 0; n < sub.length; n++) {
                sub[n] = sub[n].trim();
        }
        sub[2] = sub[2].toLowerCase();
        if (sub[2] == "cancel") sub[3] = sub[3].toLowerCase();
        return sub;
}

function removeCancels(td) {
        let ts0 = Date.now();
        let tde = splitIntoLines(td);
        let toremove = new Set();

        for (let r = 0; r < tde.length; r++) {
                if (tde[r].length == 0) continue;
                let sub = splitLine(tde[r]);

                if (sub[2] == "cancel") {
                        for (let k = r - 1; k >= 0; k--) {
                                if (toremove.has(k)) continue;

                                let ksub = tde[k].split(",");
                                if (ksub[1] == sub[1] && (ksub[2] == sub[3] || (sub[3] == "" && ksub[2] != "cancel"))) {
                                        toremove.add(k);
                                        toremove.add(r);
                                        break;
                                }
                        }
                }
        }

        if (toremove.size > 0) {
                let out = [];
                for (let i = 0; i < tde.length; i++) {
                        if (!toremove.has(i)) out.push(tde[i]);
                }
                return out.join("\n");
        }
        let ret=tde.join("\n");
   //     console.log("remove cancels " + (Date.now()-ts0) + " ms");
        return ret;
}



function processData(tdata) {
        let ts = Date.now(), ts2,ts0=ts;

  //      console.log("processData start");

        var headers = fetchHeaders(2, tdata);

        ts2 = Date.now();
   //     console.log("processData fetchHeaders: " + (ts2-ts) + " ms");
        ts = ts2;

        var orderedheaders = preorder.slice();
        orderedheaders = [...new Set([...orderedheaders, ...headers])];

        let table = buildTable(tdata, orderedheaders, sums, formulatosubstrate);

        ts2 = Date.now();
  //      console.log("processData buildTable: " + (ts2-ts) + " ms");
        ts = ts2;

        window.tableData = table;
        //renderTableHTML();

        initDataTable();

        ts2 = Date.now();
   //     console.log("processData renderTableHTML: " + (ts2-ts) + " ms");
  //      console.log("processData total: " + (ts2-(ts0)) + " ms");
}

function buildTable(tdata, headers, sums, transform) {
   //     console.log("buildTable start"); let ts= Date.now(), ts2,ts0=ts;

        var finalheaders = headers.slice();
        var finaltable = [];
        finaltable.push(finalheaders);
        let arr = splitIntoLines(tdata);

        var indexofid = {};
        var sumlengths = {};

 //       ts2= Date.now();console.log("buildTable prep : "+(ts2-ts)+" ms");ts=ts2;
 //       console.log("headers:"+headers);

        for (var r of arr) {
                if (r.length == 0) continue;
                let l = splitLine(r);

                if (!(l[1] in indexofid)) {
                        indexofid[l[1]] = finaltable.length;
                        var newrow = [];
                        var idindex = headers.indexOf("id");
                        if (idindex >= 0) newrow[idindex] = l[1];
                        finaltable.push(newrow);
                }
                l[2]=l[2].trim();
                var argindex = headers.indexOf(l[2]);
                if (argindex >= 0) {
                        if (sums.indexOf(l[2]) >= 0) {
                                if (finaltable[indexofid[l[1]]][argindex] === undefined) finaltable[indexofid[l[1]]][argindex] = [];
                                finaltable[indexofid[l[1]]][argindex].push([l[0], l[3]]);
                        }
                        else {
                                let tags=["contaminated","compost","flies","fungus flies","spent", "storage", "fruit", "sale synallois","stored"]
                                let endval=l[3];
                                if(l[2]=="stored")
                                        console.log();
                                if(tags.indexOf(l[2])>-1)
                                        endval=l[2];
                                finaltable[indexofid[l[1]]][argindex] = endval;
                                //   console.log(finaltable[indexofid[l[1]]]);
                                //  console.log(finaltable[indexofid[l[1]]][argindex]);
                                // console.log();

                        }
                }
        }

  //      ts2= Date.now();console.log("buildTable stage 1 : "+(ts2-ts)+" ms");ts=ts2;
        //    console.log("headers:"+headers);
        function displayitem(headers, item){
                /*    console.log("displayitem");
                    for(let i=0;i<headers.length;i++){
                        console.log(headers[i]+":"+item[i]);
                    }*/
        };
        displayitem(finaltable[0],finaltable[1]);

        for (var r = 1; r < finaltable.length; r++) {   // fill substrate from formula
                for (var f in formulatosubstrate) {
                        var i = finaltable[0].indexOf(f);
                        if (i < 0) continue;
                        let trans = formulatosubstrate[f][finaltable[r][i]];
                        if (trans === undefined) continue;
                        for (let p in trans) {
                                var pi = finaltable[0].indexOf(p);
                                finaltable[r][pi] = trans[p];
                        }
                }
        }

    //    ts2= Date.now();console.log("buildTable stage 2 : "+(ts2-ts)+" ms");ts=ts2;
        //  console.log("headers:"+headers);
        displayitem(finaltable[0],finaltable[1]);

        for (var r = 1; r < finaltable.length; r++) { // fill
                for (var s of sums) {
                        var i = finaltable[0].indexOf(s);
                        if (i < 0) continue;
                        let tab = finaltable[r][i];
                        if (tab === undefined) continue
                        tab = aggregate(s, tab);
                        finaltable[r][i] = tab;
                        var length = tab.length;
                        if(!sumlengths[s] || sumlengths[s]<length) sumlengths[s] = length;
                }
        }

       // ts2= Date.now();console.log("buildTable stage 3 : "+(ts2-ts)+" ms");ts=ts2;
        //    console.log("headers:"+headers);
        displayitem(finaltable[0],finaltable[1]);

        let extraheader = {};
        // Convert sums to total, add count, and expand the trailing columns in-place (pushes tags right)
        for (var s of sums) {
                var i = finaltable[0].indexOf(s);
                if (i >= 0) {
                        // Renames "harvest" to "totalharvest", removing the raw "harvest" column
                        finaltable[0][i] = "total" + s;
                        finaltable = insertColumn(finaltable, i + 1);
                        finaltable[0][i + 1] = s + "count";

                        // Insert trailing summary columns in-place
                        finaltable = insertColumn(finaltable, i + 2);
                        finaltable[0][i + 2] = "last" + s;
                        finaltable = insertColumn(finaltable, i + 3);
                        finaltable[0][i + 3] = "last" + s + "date";

                        if (sumlengths[s] > 0) extraheader[s] = i + 4;

                        let currentPos = i + 4;
                        // Insert dynamic sequential breakdown columns in-place (harvest1, harvest1date, etc.)
                        for (var suml = 1; suml <= sumlengths[s]; suml++) {
                                finaltable = insertColumn(finaltable, currentPos);
                                finaltable[0][currentPos] = s + suml;
                                currentPos++;

                                finaltable = insertColumn(finaltable, currentPos);
                                finaltable[0][currentPos] = s + suml + "date";
                                currentPos++;
                        }
                }
        }

      //  ts2= Date.now();console.log("buildTable stage 4 : "+(ts2-ts)+" ms");ts=ts2;
        //   console.log("headers:"+headers);
        displayitem(finaltable[0],finaltable[1]);

        // Populate the "totalharvest", "harvestcount", and dynamically inserted cells
        for (var r = 1; r < finaltable.length; r++) {
                for (var s of sums) {
                        var i = finaltable[0].indexOf("total" + s);
                        if (i < 0) continue;
                        let tab = finaltable[r][i], tsum = 0, ind = 0;
                        if (tab === undefined) continue;
                        let lastt;

                        // Fill sequential breakdown columns
                        for (var t of tab) {
                                finaltable[r][extraheader[s] + ind * 2] = t[1];
                                finaltable[r][extraheader[s] + ind * 2 + 1] = t[0];
                                tsum += Number(t[1]);
                                ind++;
                                lastt = t;
                        }

                        finaltable[r][i] = tsum;
                        finaltable[r][i + 1] = tab.length;

                        // Fill 'lastharvest' columns
                        if (lastt) {
                                finaltable[r][extraheader[s] - 2] = lastt[1];
                                finaltable[r][extraheader[s] - 1] = lastt[0];
                        }
                }
        }

      //  ts2= Date.now();console.log("buildTable stage 5 : "+(ts2-ts)+" ms");ts=ts2;
        //   console.log("headers:"+headers);
      //  displayitem(finaltable[0],finaltable[1]);

        // Calculate fields logic (Age, BE)
        for (var r = 1; r < finaltable.length; r++) {
                for (var c in calculatedfields) {
                        var target = finaltable[0].indexOf(c);
                        if (target < 0) continue;
                        let op = calculatedfields[c];
                        let optype = Object.keys(op).pop();
                        let args = op[optype];
                        let isdate = false;
                        for (let a of args) if (isDateField(a)) { isdate = true; break; }
                        let argvals = [];
                        function fetchfields(field) {
                                if (field == "now") return formatDate(new Date());
                                let findex = finaltable[0].indexOf(field);
                                return finaltable[r][findex];
                        }
                        let stop = false;
                        for (let a of args) {
                                let fv = fetchfields(a);
                                if (fv === undefined) { stop = true; break; }
                                argvals.push(fv);
                        }
                        if (stop) continue;
                        if (optype == "substract") {
                                if (isdate) finaltable[r][target] = daysDiff(argvals[0], argvals[1]);
                                else finaltable[r][target] = argvals[0] - argvals[1];
                        }
                        if (optype == "divide") finaltable[r][target] = "" + Math.round(100 * argvals[0] / argvals[1]) + "%";
                }
        }
     //   ts2= Date.now();console.log("buildTable stage 6 : "+(ts2-ts)+" ms");ts=ts2;
        //    console.log("headers:"+headers);
    //    displayitem(finaltable[0],finaltable[1]);

    //    console.log("buildTable total : "+(ts2-ts0)+" ms");
        return finaltable;
}

function insertColumn(array, index) {
        for (var r in array) array[r].splice(index, 0, undefined);
        return array;
}

function formatDate(d) {
        return "" + d.getDate() + "/" + (d.getMonth() + 1) + "/" + (d.getFullYear() - 2000);
}

function isDateField(text) {
        if (text.includes("date")) return true;
        if (text == "now") return true;
        return false;
}

function makeDate(d) {
        let nd = new Date(0);
        if (d === undefined) {
                console.log();
        }
        let datetab = d.split("/");
        nd.setDate(datetab[0]);
        nd.setMonth(datetab[1] - 1);
        nd.setYear("20" + datetab[2]);
        return nd;
}

function daysDiff(d1, d2) {
        let diff = (makeDate(d1).getTime() - makeDate(d2).getTime()) / (1000 * 3600 * 24);
        if (diff < 0) diff = -diff;
        return Math.floor(diff);
}

function aggregate(name, odata) {
        let ts0 = Date.now();
        function mindist(date, table) {
                let min;
                for (let t of table) {
                        let diff = daysDiff(t[0], date);
                        if (min === undefined) min = diff;
                        else if (diff < min) min = diff;
                }
                return min;
        }
        function mergedata(tab) {
                let d = 0, v = 0;
                for (let t of tab) {
                        if (d == 0 || makeDate(d).getTime() > makeDate(t[0]).getTime()) d = t[0];
                        v += Number(t[1]);
                }
                let date = d;
                return [date, v];
        }
        if (!(name in aggregated)) return odata;
        if (odata === undefined) {
                console.log();
        }
        var data = odata.slice();
        var period = aggregated[name];
        var toaggregate = [], ndata = [];
        while (data.length > 0) {
                for (var d = 0; d < data.length; d++) {
                        if (toaggregate.length == 0) { toaggregate.push(data[d]); data.splice(d, 1); d--; continue; }
                        var dist = mindist(data[d][0], toaggregate)
                        if (dist <= period) { toaggregate.push(data[d]); data.splice(d, 1); d--; }
                }
                ndata.push(mergedata(toaggregate));
                toaggregate = [];
        }

   //     console.log("aggregate(" + name + "): " + (Date.now()-ts0) + " ms");
        return ndata;
}
function processAndBuildAllTables(rawData, savedRequests) {
        let tdata2 = removeCancels(rawData);
        let tdata3 = removeConsecutiveDuplicates(tdata2);
        var headers = fetchHeaders(2, tdata3);
        var orderedheaders = preorder.slice();
        orderedheaders = [...new Set([...orderedheaders, ...headers])];

        parsedTableData = buildTable(tdata3, orderedheaders, sums, formulatosubstrate);

        let dtHeaders = parsedTableData[0].map((h, colIndex) => ({
                title: h, defaultContent: "",
                className: (h === "id" || h === "blockdate" || h === "totalharvest") ? "boldColumn" : "",
                render: function (data, type, row) {
                        if (data == null) return "";
                        if (h === "BE") {
                                let num = parseFloat(String(data).replace("%", ""));
                                if (type === "sort" || type === "type") return num;
                                return data;
                        }
                        if (h === "blockdate" || h.endsWith("date")) {
                                let p = String(data).split("/");
                                if (p.length === 3) {
                                        let ts = new Date(2000 + Number(p[2]), Number(p[1]) - 1, Number(p[0])).getTime();
                                        if (type === "sort" || type === "type") return ts;
                                }
                                return data;
                        }
                        if (h === "Age" || h === "spawn" || h === "totalsubstrate" || h === "totalharvest" || h === "harvestcount" || /^harvest\d+$/.test(h)) {
                                let n = Number(data);
                                if (!isNaN(n) && (type === "sort" || type === "type")) return n;
                        }
                        return data;
                }
        }));
}
function fetchHeaders(col, data) {
        var arr = data.split("\n"), headers = {};
        for (var r of arr) {
                if (r.length == 0) continue;
                var l = r.split(",");
                headers[l[col]] = 1;
        }
        return Object.keys(headers);
}
function parseBlockDate(text){
        if(!text) return NaN;
        let p=text.split("/");
        if(p.length!==3) return NaN;
        return new Date(2000+Number(p[2]), Number(p[1])-1, Number(p[0])).getTime();
}

function updateAverageRow(api, tableId, headers) {
        if (!api || !tableId || !headers) {
                console.error("updateAverageRow missing required arguments.");
                return;
        }

        const rows = api.rows({search:'applied'}).data().toArray();
        const avgCells = $("#" + tableId + " tfoot th");

        headers.forEach((name, col)=>{
                if (name === "id") { avgCells.eq(col).text("n=" + rows.length); return; }
                let sum = 0, count = 0, isPercent = false;

                rows.forEach(r=>{
                        let v = r[col];
                        if (v === undefined || v === null || v === "") return;

                        if (typeof v === "string" && v.endsWith("%")) {
                                let n = parseFloat(v);
                                if (Number.isFinite(n)) { sum += n; count++; isPercent = true; }
                                return;
                        }
                        if (typeof v === "string" && v.match(/^\d+\/\d+\/\d+$/)) return;

                        if (typeof v === "number") {
                                sum += v; count++;
                        } else if (typeof v === "string" && v.trim() !== "") {
                                if (/^-?\d+(\.\d+)?$/.test(v.trim())) { sum += Number(v); count++; }
                        }
                });

                if (count <= 0 || !Number.isFinite(sum / count)|| (sum / count)==0) {
                        avgCells.eq(col).text("");
                        return;
                }

                let avg = sum / count;


                avgCells.eq(col).text(isPercent ? avg.toFixed(1)+"%" : avg.toFixed(1));
        });
}