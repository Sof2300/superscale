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

// MOVED 'harvest' to be immediately after Age & BE. Tags will dynamically load AFTER this predefined list.
var preorder = ['id', 'species', 'blockdate', 'formula', 'totalsubstrate', 'spawn', 'spawncode', 'Age', 'BE', 'harvest'];
var keeplast = ["harvest"];
var sums = ["harvest"];
var aggregated = { "harvest": 7 };
var calculatedfields = { "Age": { "substract": ["now", "blockdate"] }, "BE": { "divide": ["totalharvest", "totalsubstrate"] } };
// Commands treated as tags: their cell value is the date the tag was applied, so their
// columns are sortable and filterable as dates just like blockdate/*date columns.
var tagCommands = ["contaminated", "compost", "flies", "fungus flies", "spent", "storage", "fruit", "sale synallois", "stored"];
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

        let table = buildTable(tdata, orderedheaders, sums);

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

function estimateSubstrateFromFormula(formula) {
        var multiplier = 0;
        var re = /x(\d+(?:\.\d+)?)/ig;
        var match;
        while ((match = re.exec(formula)) !== null) multiplier = Number(match[1]);
        return multiplier > 0 ? parseInt(multiplier * 265, 10) : 0;
}

function buildTable(tdata, headers, sums) {
   //     console.log("buildTable start"); let ts= Date.now(), ts2,ts0=ts;

        var finalheaders = headers.slice();
        var finaltable = [];
        finaltable.push(finalheaders);
        let arr = splitIntoLines(tdata);

        var indexofid = {};
        var sumlengths = {};
        var substrateSeen = {};
        var substrateIndex = headers.indexOf("totalsubstrate");

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
                var row = finaltable[indexofid[l[1]]];
                if (l[2].indexOf("substrate") >= 0 && substrateIndex >= 0) {
                        substrateSeen[l[1]] = true;
                        row[substrateIndex] = (parseInt(row[substrateIndex], 10) || 0) + (parseInt(l[3], 10) || 0);
                }
                var argindex = headers.indexOf(l[2]);
                if (argindex >= 0) {
                        if (sums.indexOf(l[2]) >= 0) {
                                if (finaltable[indexofid[l[1]]][argindex] === undefined) finaltable[indexofid[l[1]]][argindex] = [];
                                finaltable[indexofid[l[1]]][argindex].push([l[0], l[3]]);
                        }
                        else {
                                let endval=l[3];
                                if(l[2]=="stored")
                                        console.log();
                                if(tagCommands.indexOf(l[2])>-1)
                                        endval=l[0];
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

        var formulaIndex = headers.indexOf("formula");
        for (var r = 1; r < finaltable.length; r++) {
                if (substrateSeen[finaltable[r][headers.indexOf("id")]] || substrateIndex < 0) continue;
                var estimate = estimateSubstrateFromFormula(finaltable[r][formulaIndex] || "");
                if (estimate > 0) finaltable[r][substrateIndex] = estimate;
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



      //  ts2= Date.now();console.log("processData stage 5 : "+(ts2-ts)+" ms");ts=ts2;
        //   console.log("headers:"+headers);
      //  displayitem(finaltable[0],finaltable[1]);

        // Calculate fields logic (Age, BE)
        for (var r = 1; r < finaltable.length; r++) {
                for (var c in calculatedfields) {
                        let row=finaltable[r];
                        if(row[0]=="S231") {
                                console.log("PB here");
                        }
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

// Single parser for the D/M/YY dates used by the viz pages.
// Returns an Invalid Date (NaN) when the value is not such a date, so callers
// can use Number.isFinite(makeDate(v).getTime()) to test a date cell.
function makeDate(d) {
        if (d === undefined || d === null) return new Date(NaN);
        let text = "" + d;
        if (text.indexOf("/") < 0) return new Date(NaN);
        let tab = text.trim().split("/");
        if (tab.length !== 3) return new Date(NaN);
        let day = Number(tab[0]), month = Number(tab[1]), year = Number(tab[2]);
        if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return new Date(NaN);
        if (year < 100) year += 2000;
        return new Date(year, month - 1, day);
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
function fetchHeaders(col, data) {
        var arr = data.split("\n"), headers = {};
        for (var r of arr) {
                if (r.length == 0) continue;
                var l = r.split(",");
                headers[l[col]] = 1;
        }
        return Object.keys(headers);
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

function applyRowFilter(rowData, headers, req) {
        if (!req) return true;

        let input = (req.search || "").toLowerCase();
        let allChecks = [];
        let conditionRegex = /([a-z0-9_]+)\s*(==|!=|<=|>=|<|>)\s*(-?\d+(?:\.\d+)?|empty)/gi;

        input = input.replace(conditionRegex, function(match, colName, op, val) {
                let isMissing = (val.toLowerCase() === 'empty');
                allChecks.push({ type: 'numeric', col: colName.toLowerCase(), op: op, val: isMissing ? 'empty' : parseFloat(val) });
                return "";
        });

        let words = input.split(/\s+/).filter(w => w.trim() !== "");
        for (let w of words) {
                let isNegation = w.startsWith("!");
                let searchTerm = isNegation ? w.substring(1) : w;
                if (searchTerm !== "") allChecks.push({ type: 'text', term: searchTerm, isNegation: isNegation });
        }

        if (allChecks.length > 0) {
                let rowText = rowData.join(" ").toLowerCase();
                let matchText = req.isAnd ? true : false;

                for (let check of allChecks) {
                        let conditionMet = false;
                        if (check.type === 'numeric') {
                                let colIndex = headers.findIndex(h => h.toLowerCase() === check.col);
                                if (colIndex >= 0) {
                                        let cellValue = rowData[colIndex];
                                        let isEmpty = (cellValue === undefined || cellValue === null || String(cellValue).trim() === "");

                                        if (check.val === 'empty') {
                                                if (check.op === '==') conditionMet = isEmpty;
                                                else if (check.op === '!=') conditionMet = !isEmpty;
                                        } else if (!isEmpty) {
                                                if (typeof cellValue === 'string' && cellValue.endsWith('%')) {
                                                        cellValue = parseFloat(cellValue);
                                                } else {
                                                        cellValue = Number(cellValue);
                                                }
                                                if (!isNaN(cellValue)) {
                                                        if (check.op === '==') conditionMet = (cellValue === check.val);
                                                        else if (check.op === '!=') conditionMet = (cellValue !== check.val);
                                                        else if (check.op === '<') conditionMet = (cellValue < check.val);
                                                        else if (check.op === '<=') conditionMet = (cellValue <= check.val);
                                                        else if (check.op === '>') conditionMet = (cellValue > check.val);
                                                        else if (check.op === '>=') conditionMet = (cellValue >= check.val);
                                                }
                                        }
                                }
                        } else if (check.type === 'text') {
                                let containsTerm = rowText.includes(check.term);
                                // Also search in column headers where the row has a non-null value
                                if (!containsTerm) {
                                        for (let i = 0; i < headers.length; i++) {
                                                let header = headers[i].toLowerCase();
                                                if (header.includes(check.term)) {
                                                        let cellValue = rowData[i];
                                                        if (cellValue !== undefined && cellValue !== null && String(cellValue).trim() !== "") {
                                                                containsTerm = true;
                                                                break;
                                                        }
                                                }
                                        }
                                }
                                conditionMet = check.isNegation ? !containsTerm : containsTerm;
                        }

                        if (req.isAnd) {
                                if (!conditionMet) { matchText = false; break; }
                        } else {
                                if (conditionMet) { matchText = true; break; }
                        }
                }
                if (!matchText) return false;
        }

        if (req.dateFilter && req.dateFilter.enabled) {
                let colName = req.dateFilter.column;
                let colIndex = headers.indexOf(colName);
                if (colIndex >= 0) {
                        let val = rowData[colIndex];
                        if (!val) return false;
                        let rowDate = makeDate(val).getTime();
                        if (!Number.isFinite(rowDate)) return false;
                        if (req.dateFilter.from && rowDate < new Date(req.dateFilter.from).getTime()) return false;
                        if (req.dateFilter.to && rowDate >= new Date(req.dateFilter.to).getTime() + 86400000) return false;
                }
        }
        return true;
}

// --- Hideable columns (shared by the table pages) ---
// `hidden` is a plain array of header names owned by the caller: a single working list in
// BlockViz.html, and one list per saved request (req.hiddenColumns) in the Table View.
function isColumnHidden(hidden, header) { return hidden.indexOf(header) >= 0; }

// --- Request description (shared by the Table View and the Graphic View) ---
// Spells out a saved request the way it was typed in Block Explore, so a page can show it next to
// the request name. Returns an HTML fragment (the search text is emphasised).
function describeRequest(req) {
        let parts = [];
        parts.push(req.search ? `search: <strong>${req.search}</strong>` : "<em>no search text</em>");
        if (req.search) parts.push(req.isAnd ? "require ALL conditions (AND)" : "require ANY condition (OR)");
        if (req.dateFilter && req.dateFilter.enabled) {
                parts.push(`date filter on ${req.dateFilter.column} from ${req.dateFilter.from || "…"} to ${req.dateFilter.to || "…"}`);
        }
        return parts.join(" &nbsp;|&nbsp; ");
}

// The per-harvest breakdown (harvest1/harvest1date, ...) plus the harvest summary columns,
// i.e. everything harvest related except "totalharvest", so the table can be reduced to totals.
function isHarvestDetailColumn(header) {
        if (header === "totalharvest") return false;
        if (header === "harvestcount" || header === "lastharvest" || header === "lastharvestdate") return true;
        return /^harvest\d+(date)?$/i.test(header);
}

// Tag columns: the date valued tags (tagCommands) plus the other tags declared in alldata/config.json.
var tagColumns = [...new Set([...tagCommands, "comment", "sale", "glifada", "dry-harvest", "wet-harvest", "overmature-harvest", "moldy-harvest", "larva-in-harvest", "data-trash"])];
function isTagColumn(header) { return tagColumns.indexOf(header) >= 0; }

// Headers that hold no value at all in the given rows.
function findEmptyColumns(headers, rows) {
        return headers.filter((h, i) => rows.every(r => r[i] === undefined || r[i] === null || String(r[i]).trim() === ""));
}

// One checkbox per column inside the .col-chooser-panel, plus small group buttons: the whole
// table, the columns with no data, the harvest detail (keeping only totalharvest) and the tags.
function buildColumnChooser($panel, headers, hidden, onToggle, emptyColumns) {
        $panel.empty();
        emptyColumns = emptyColumns || [];

        // A button is pressed when every column of its group is hidden. The state is always deduced
        // from the hidden list, so the buttons stay consistent with each other and with the
        // checkboxes: hiding everything also presses harvest, tags and empty when they are relevant.
        let groups = [
                { cls: "col-showall", off: "Hide all", on: "Show all", match: () => true },
                { cls: "col-toggle-empty", label: "empty", match: h => emptyColumns.indexOf(h) >= 0 },
                { cls: "col-toggle-harvest", label: "harvest", match: isHarvestDetailColumn },
                { cls: "col-toggle-tags", label: "tags", match: isTagColumn }
        ];

        let $actions = $("<div>").addClass("col-chooser-actions").appendTo($panel);
        groups.forEach(g => {
                g.members = headers.filter(g.match);
                g.$btn = $("<button>").attr({ type: "button", class: g.cls }).appendTo($actions);
                if (g.members.length === 0) g.$btn.hide(); // nothing of that kind on this page
        });

        let $list = $("<div>").addClass("col-chooser-list").appendTo($panel);
        headers.forEach(h => {
                $list.append(
                        $("<label>").append(
                                $("<input type='checkbox'>").prop("checked", !isColumnHidden(hidden, h))
                        ).append($("<span>").text(h))
                );
        });

        function isGroupPressed(g) {
                return g.members.length > 0 && g.members.every(h => isColumnHidden(hidden, h));
        }

        function syncCheckboxes() {
                $list.find("input[type=checkbox]").each(function (i) {
                        this.checked = !isColumnHidden(hidden, headers[i]);
                });
        }

        function refreshButtons() {
                groups.forEach(g => {
                        let pressed = isGroupPressed(g);
                        g.$btn.toggleClass("pressed", pressed);
                        g.$btn.text(g.label ? g.label : (pressed ? g.on : g.off));
                });
        }

        function afterChange() {
                syncCheckboxes();
                refreshButtons();
                if (onToggle) onToggle();
        }

        $panel.off("change").on("change", "input[type=checkbox]", function () {
                let i = $list.find("input[type=checkbox]").index(this);
                let h = headers[i];
                let at = hidden.indexOf(h);
                if (this.checked && at >= 0) hidden.splice(at, 1);
                else if (!this.checked && at < 0) hidden.push(h);
                afterChange();
        });
        $panel.off("click").on("click", "button", function () {
                let g = groups.find(x => x.$btn[0] === this);
                if (!g) return;
                let pressed = isGroupPressed(g);
                g.members.forEach(h => {
                        let at = hidden.indexOf(h);
                        if (pressed && at >= 0) hidden.splice(at, 1);
                        else if (!pressed && at < 0) hidden.push(h);
                });
                afterChange();
        });

        syncCheckboxes();
        refreshButtons();
}

// Applies a hidden set to the given tables (all initialised tables on the page by default).
function applyColumnVisibility(headers, hidden, $tables) {
        ($tables || $("table")).each(function () {
                if (!$.fn.DataTable.isDataTable(this)) return;
                let api = $(this).DataTable();
                headers.forEach((h, i) => api.column(i).visible(!isColumnHidden(hidden, h), false));
                api.columns.adjust().draw(false);
        });
}

// Close an open chooser when clicking anywhere outside it.
$(document).on("click", function (e) {
        $("details.col-chooser[open]").each(function () {
                if (!$(e.target).closest(this).length) $(this).removeAttr("open");
        });
});
