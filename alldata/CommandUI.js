// Debug flag for probability model printouts
const DEBUG_PROBABILITY_MODEL = false;

// Predefined tag colors based on Okabe-Ito colorblind-friendly palette
// Refined with controlled lightness/saturation differences for better distinguishability
const predefinedTagColors = {
    // Fruit and sale - two shades of green
    "fruit": "hsl(176, 100%, 47%)",          // Bluish green (Okabe-Ito #009E73)
    "sale": "hsl(120, 70%, 55%)",            // Bright green (money/profit)

    // Neutral/misc - two distinct shades of grey
    "comment": "hsl(0, 0%, 75%)",            // Light gray (neutral comments)
    "data-trash": "hsl(0, 0%, 60%)",         // Darker gray (trash)

    // Moldy and larva - two distinct shades of purple
    "moldy-harvest": "hsl(328, 53%, 64%)",   // Reddish purple (Okabe-Ito #CC79A7)
    "larva-in-harvest": "hsl(280, 50%, 70%)", // Blue-purple (larvae)

    // Storage and glifada - two distinct shades of sandy yellow
    "storage": "hsl(48, 89%, 63%)",          // Yellow (Okabe-Ito #F0E442)
    "glifada": "hsl(45, 60%, 75%)",          // Sandy yellow (location)

    // Flies, spent, compost - orange, brown, dark brown
    "flies": "hsl(36, 100%, 45%)",           // Orange (Okabe-Ito #E69F00)
    "spent": "hsl(30, 60%, 50%)",            // Brown (exhausted)
    "compost": "hsl(25, 55%, 40%)",          // Dark brown (compost)

    // Contamination - vermilion (danger)
    "contaminated": "hsl(21, 81%, 48%)",     // Vermilion (Okabe-Ito #D55E00)

    // Harvest types - distinct colors from the palette
    "dry-harvest": "hsl(188, 60%, 65%)",     // Light teal (dry)
    "wet-harvest": "hsl(204, 70%, 70%)",     // Sky blue (Okabe-Ito #56B4E9)
    "overmature-harvest": "hsl(210, 75%, 55%)" // Blue (old/overripe - Okabe-Ito #0072B2)
};

// Distinct color palette for new tags based on Okabe-Ito variations
// Colorblind-friendly palette with controlled lightness/saturation differences
const distinctColorPalette = [
    "hsl(21, 70%, 75%)",     // Vermilion light
    "hsl(36, 75%, 70%)",     // Orange light
    "hsl(48, 80%, 75%)",     // Yellow light
    "hsl(90, 65%, 70%)",     // Green-yellow
    "hsl(120, 60%, 70%)",    // Green
    "hsl(176, 65%, 65%)",    // Bluish green
    "hsl(204, 65%, 75%)",    // Sky blue light
    "hsl(208, 70%, 65%)",    // Blue
    "hsl(220, 70%, 80%)",    // Gray-blue light
    "hsl(328, 50%, 75%)",    // Purple light
    "hsl(335, 55%, 80%)",    // Pink light
    "hsl(15, 65%, 75%)",     // Red-orange
    "hsl(30, 60%, 65%)",     // Brown-orange
    "hsl(42, 55%, 60%)",     // Ochre
    "hsl(60, 50%, 65%)",     // Yellow-ochre
    "hsl(100, 55%, 70%)",    // Chartreuse
    "hsl(150, 55%, 75%)",    // Teal
    "hsl(188, 60%, 75%)",    // Cyan
    "hsl(250, 50%, 75%)",    // Violet
    "hsl(280, 45%, 75%)",    // Orchid
    "hsl(300, 45%, 80%)"     // Lavender
];

// Generate a consistent color from a string seed
function stringToColor(str) {
    // Check if tag has a predefined color
    if (predefinedTagColors[str]) {
        return predefinedTagColors[str];
    }

    // For new tags, use hash to pick from distinct palette
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % distinctColorPalette.length;
    return distinctColorPalette[index];
}

///////////////////////
class MultiLineField {
    constructor(id, value) {
        this.id = id;
        this.value = value;
    }

    attach(parent) {
        this.createField(this.id, this.value, parent);
    }

    createField(id, value, parent) {
        this.valuecomp = new Input(parent, id);
        this.valuecomp.setText(value);
    }
 
    update(value) {
        this.valuecomp.setText(value);
    }

    getUserInput() {
        return this.valuecomp.userinput;
    }
};


var lineui_count = 0;

class LineUI {
    constructor(data, order, table) {
        this.table = table;

        this.createUI(data, order);
    }

    getTableContent() {
        return this.tablecontent;
    }

    getKeyStyle(key) {
        var titlestyle = {"font-size": "65%", "text-align": "right"};

        return titlestyle;
    }

    getValueStyle(key) {
        var valstyle = {"font-weight": "bold"};
        if (key == "id") valstyle = {"font-size": "150%", "font-weight": "bold"};
        return valstyle;
    }

    update(data) {
        for (let dkey in data) {
            let key = 0;
            for (let k in this.valuecomps) if (dkey.endsWith(k)) {
                key = k;
                break;
            }
            if (!key) {
                if (DEBUG_PROBABILITY_MODEL) console.log("pb here");
                continue;
            }
            var val = String(data[dkey]);
            if (this.valuecomps[key]) {
                // Only apply case correction for argument field (should be lowercase)
                // For id, date, and command, preserve user's case
                if (key === "argument" && this.valuecomps[key].text.toLowerCase() == val && this.valuecomps[key].text != val) this.valuecomps[key].setText(val);
                if (this.valuecomps[key].text != val) {
                    this.valuecomps[key].updateText(val);
                    this.titlecomps[key].setText(dkey);
                    this.valuecomps[key].setStyle("visibility", "visible");//removeStyle("visibility");
                    this.titlecomps[key].setStyle("visibility", "visible");//removeStyle("visibility");
                    /*  if(key=="date" && this.valuecomps[key].text!="") {
                          let formatted = standardizeDateString(this.valuecomps[key].text);
                          if (formatted === "Invalid Date" || formatted.trim() === "") {
                              // Invalid or empty: keep/turn it red
                             // this.valuecomps[key].setStyle("background-color", "#ffe6e6");
                             // this.valuecomps[key].setStyle("border", "1px solid red");
                              if(!this.valuecomps[key].savedbgcolor) this.valuecomps[key].savedbgcolor=this.valuecomps[key].activebgcolor;
                              if(!this.valuecomps[key].savedbgcolorborder) this.valuecomps[key].savedbgcolorborder=this.valuecomps[key].activebgcolorborder;
                              this.valuecomps[key].activebgcolor="#ffe6e6";
                              this.valuecomps[key].activebgcolorborder="1px solid red";
                          } else {
                              // Valid: clear red background and update with standard format
                              if(this.valuecomps[key].savedbgcolor) {
                                  this.valuecomps[key].activebgcolor= this.valuecomps[key].savedbgcolor;
                                  this.valuecomps[key].savedbgcolor=0;
                              }
                              if(this.valuecomps[key].savedbgcolorborder) {
                                  this.valuecomps[key].activebgcolorborder = this.valuecomps[key].savedbgcolorborder;
                                  this.valuecomps[key].savedbgcolorborder=0;
                              }
                              //let saveval=this.valuecomps[key];
                              this.valuecomps[key].setText(formatted);
                              this.valuecomps[key].remotevalue=val;
                            //  this.valuecomps[key].remotevalue=undefined;
                         //     this.valuecomps[key].updateFromUser();

                         //     this.valuecomps[key].updateBG();
                          }
                      }*/
                } else this.valuecomps[key].updateText(val, 1);
                //!this.valuecomps[key].isUserModified() &&
            }
        }
        for (let key in this.valuecomps) {
            let dkey = 0;
            for (let dk in data)
                if (dk.endsWith(key)) {
                    dkey = dk;
                    break;
                }
            if (!dkey) {
                this.valuecomps[key].setStyle("visibility", "hidden");
                this.titlecomps[key].setStyle("visibility", "hidden");
            } else {

            }
        }


    }

    addCell(style) {
        return this.table.addCell(this.row.index, style);
    };

    remove() {
        this.row.selfRemove();
    }

    updateFile(datafile) {
        this.updateTags(datafile);
    }

    updateTags(data) {
        this.datafile = data; // Store datafile for later use
        let commands = this.extractHistoricalTags(data, 2) || [];
        let argsByCommand = this.extractArgumentsByCommand(data) || {};
        this.argsByCommand = argsByCommand;

        if (DEBUG_PROBABILITY_MODEL) {
            console.log("=== updateTags ===");
            console.log("valuecomps:", this.valuecomps);
            console.log("argsByCommand:", argsByCommand);
        }

        // Initially set argument suggestions to all arguments
        let allArgs = this.extractHistoricalTags(data, 3) || [];

        // Check if there's a current command value to filter arguments
        let currentCommand = null;
        if (this.valuecomps && this.valuecomps["command"]) {
            currentCommand = this.valuecomps["command"].getUserInput() || this.valuecomps["command"].text;
            if (DEBUG_PROBABILITY_MODEL) {
                console.log("currentCommand from getUserInput:", this.valuecomps["command"].getUserInput());
                console.log("currentCommand from text:", this.valuecomps["command"].text);
            }
        }
        if (DEBUG_PROBABILITY_MODEL) console.log("final currentCommand:", currentCommand);

        // Update datalists
        for (let i = 0; i < this.datalists.length; i++) {
            if (this.datalists[i].id && this.datalists[i].id.includes("command")) {
                this.datalists[i].setOptions(commands);
            } else if (this.datalists[i].id && this.datalists[i].id.includes("argument")) {
                if (DEBUG_PROBABILITY_MODEL) console.log("Setting argument datalist");
                // If there's a current command and it has specific arguments, use those
                if (currentCommand && argsByCommand[currentCommand]) {
                    if (DEBUG_PROBABILITY_MODEL) console.log("Using specific args for command:", currentCommand, argsByCommand[currentCommand]);
                    this.datalists[i].setOptions(argsByCommand[currentCommand]);
                } else {
                    if (DEBUG_PROBABILITY_MODEL) console.log("Using all args");
                    this.datalists[i].setOptions(allArgs);
                }
            }
        }
    }

    extractArgumentsByCommand(historyString) {
        if (!historyString) return {};
        var lines = historyString.split('\n');
        var argsByCommand = {};

        for (var i = 0; i < lines.length; i++) {
            var parts = lines[i].split(',');
            if (parts.length > 3) {
                var command = parts[2].trim();
                var arg = parts[3].trim();
                // Check if it exists and is NOT a strict number
                if (arg && isNaN(Number(arg))) {
        //            console.log("Checking arg:", arg, "for command:", command, "isGoodValue:", this.isGoodValue(arg));
                    if (this.isGoodValue(arg)) {
                        if (!argsByCommand[command]) {
                            argsByCommand[command] = new Set();
                        }
                        argsByCommand[command].add(arg);
                    }
                }
            }
        }
        // Convert Sets to Arrays
        for (var cmd in argsByCommand) {
            argsByCommand[cmd] = Array.from(argsByCommand[cmd]);
        }
        if (DEBUG_PROBABILITY_MODEL) console.log("Final argsByCommand:", argsByCommand);
        return argsByCommand;
    }

    isGoodValue(value) {
        if (value.includes("/")) return false;
        if (value.includes("#")) return false; // Filter out spawncode codes
        return true;
    }

    extractHistoricalTags(historyString, columnOffset) {
        if (!historyString) return [];
        var lines = historyString.split('\n');
        var values = new Set(); // Set prevents duplicates natively

        for (var i = 0; i < lines.length; i++) {
            var parts = lines[i].split(',');
            if (parts.length > columnOffset) {
                var val = parts[columnOffset].trim();
                // Check if it exists and is NOT a strict number
                if (val && isNaN(Number(val))) {
                    if (this.isGoodValue(val)) values.add(val);
                }
            }
        }
        let result = Array.from(values);
        return result || []; // Ensure we never return undefined
    }


    createUI(data, order) {
        this.row = this.table.addRow();
        this.order = order;
        if (!data) return;
        this.valuecomps = {};
        this.titlecomps = {};
        this.datalists = [];
        for (var o in order) {
            var key = order[o], dkey = key, found = 0;
            ;
            for (var dk in data) if (dk.endsWith(key)) {
                dkey = dk;
                found = 1;
                break;
            }
            var keycell = this.table.addCell(this.row.index, this.getKeyStyle(key));
            var valcell = this.table.addCell(this.row.index, this.getValueStyle(key));
            keycell.setStyle("padding-right", "2px");
            valcell.setStyle("padding-left", "0");
            var valuecomp = new Input(valcell, valcell.id + "_input_" + key + lineui_count++);

            // Store reference to lineui for command checking
            valuecomp.lineui = this;
            valuecomp.fieldKey = key;

            // Add CSV comma replacement for all fields
            valuecomp.addListener("onkeyup", function (arg) {
                let val = this.getCurrentValue();
                if (val && val.includes(",")) {
                    // Replace comma with semicolon to avoid CSV issues
                    let newVal = val.replace(/,/g, ";");
                    this.setUserInput(newVal);
                    // Move cursor to end
                    if (this.element && this.element.setSelectionRange) {
                        this.element.setSelectionRange(newVal.length, newVal.length);
                    }
                }
            }.bind(valuecomp));

            // If this is a command or argument field, attach the datalist
            if (key === "command" || key === "argument") {
                let datalistId = "historical_" + key + "_list_" + lineui_count;

                // Create the Datalist component (once per LineUI instance)
                let dl = new DataList(this.table, datalistId);
                dl.setOptions([]);
                this.datalists.push(dl);

                // Link the Input to the Datalist
                valuecomp.setAttribute("list", datalistId);

                // Add listener to command field to update argument suggestions
                if (key === "command") {
                    valuecomp.addListener("onchange", function() {
                        let currentCommand = this.getCurrentValue();
                        if (this.lineui && this.lineui.argsByCommand && this.lineui.argsByCommand[currentCommand]) {
                            // Find the argument datalist by ID
                            for (let i = 0; i < this.lineui.datalists.length; i++) {
                                if (this.lineui.datalists[i].id && this.lineui.datalists[i].id.includes("argument")) {
                                    this.lineui.datalists[i].setOptions(this.lineui.argsByCommand[currentCommand]);
                                    break;
                                }
                            }
                        } else {
                            // If no specific arguments for this command, show all arguments
                            // Only if datafile is available
                            if (this.lineui && this.lineui.datafile) {
                                let allArgs = this.lineui.extractHistoricalTags(this.lineui.datafile, 3);
                                for (let i = 0; i < this.lineui.datalists.length; i++) {
                                    if (this.lineui.datalists[i].id && this.lineui.datalists[i].id.includes("argument")) {
                                        this.lineui.datalists[i].setOptions(allArgs);
                                        break;
                                    }
                                }
                            }
                        }
                    }.bind(valuecomp));
                    // Store reference to lineui in valuecomp
                    valuecomp.lineui = this;
                }
            }
            if (key == "id") valuecomp.addListener("onkeyup",  // really not the right place, but cannot find where better to put it
                function (arg) {
          //          console.log(arg);
                    if (arg.key == "Enter" && currentcommandUI) currentcommandUI.set();
                });
            if (key == "command") valuecomp.addListener("onkeyup",
                function (arg) {
                    if (arg.key == "Enter") {
                        if (currentcommandUI) currentcommandUI.set();
                    }
                });

            // Define validation and reformat function first
            if (key === "date" || key === "argument") {
                valuecomp.validateAndReformatDate = function(fieldKey) {
                    let val = this.getCurrentValue();
                    // Check if command contains "date" for strict format
                    let currentCommand = null;
                    if (this.lineui && this.lineui.valuecomps && this.lineui.valuecomps["command"]) {
                        currentCommand = this.lineui.valuecomps["command"].getCurrentValue() || this.lineui.valuecomps["command"].text;
                    }

                    let isValid = true;
                    let formatted = val;
                    let commandContainsDate = currentCommand && currentCommand.toLowerCase().includes("date");

                    if (fieldKey === "date" || (fieldKey === "argument" && commandContainsDate)) {
                        // For date field or argument when command contains "date", enforce strict D/M/YY format
                        const validDate = parseToDate(val);
                        if (validDate) {
                            // Reformat to D/M/YY
                            formatted = formatToDMYY(validDate);
                            isValid = true;
                        } else {
                            isValid = false;
                        }
                    } else {
                        // For argument field when command doesn't contain "date", keep original behavior
                        let dateFormatted = standardizeDateString(val);
                        if (dateFormatted !== "Invalid Date" && dateFormatted.trim() !== "") {
                            formatted = dateFormatted;
                        }
                    }

                    if (!isValid) {
                        // Invalid or empty: keep/turn it red
                        if (!this.savedbgcolor) this.savedbgcolor = this.activebgcolor;
                        if (!this.savedbgcolorborder) this.savedbgcolorborder = this.activebgcolorborder;
                        this.activebgcolor = "#ffe6e6";
                        this.activebgcolorborder = "1px solid red";
                    } else {
                        // Valid: clear red background and update with standard format
                        if (this.savedbgcolor) {
                            this.activebgcolor = this.savedbgcolor;
                            this.savedbgcolor = 0;
                        }
                        if (this.savedbgcolorborder) {
                            this.activebgcolorborder = this.savedbgcolorborder;
                            this.savedbgcolorborder = 0;
                        }
                        let saveval = this.remotevalue;
                        this.setUserInput(formatted);
                        this.remotevalue = saveval;
                    }
                };
            }

            // Add Enter key handlers after validation function is defined
            if (key == "date") valuecomp.addListener("onkeyup",
                function (arg) {
                    if (arg.key == "Enter") {
                        // First validate and reformat
                        this.validateAndReformatDate(key);
                        // Then check if valid before setting
                        if (this.activebgcolor !== "#ffe6e6" && currentcommandUI) {
                            currentcommandUI.set();
                        }
                    }
                }.bind(valuecomp));
            if (key == "argument") valuecomp.addListener("onkeyup",
                function (arg) {
                    if (arg.key == "Enter") {
                        // First validate and reformat
                        this.validateAndReformatDate(key);
                        // Then check if valid before setting
                        if (this.activebgcolor !== "#ffe6e6" && currentcommandUI) {
                            currentcommandUI.set();
                        }
                    }
                }.bind(valuecomp));

            // Add blur listeners for validation
            if (key === "date") {
                valuecomp.addListener("onkeyup", function (arg) {
                    this.validateAndReformatDate(key);
                }.bind(valuecomp));
                valuecomp.addListener("onblur", function (arg) {
                    this.validateAndReformatDate(key);
                }.bind(valuecomp));
            }

            // Add blur listener for argument field
            if (key === "argument") {
                valuecomp.addListener("onkeyup", function (arg) {
                    this.validateAndReformatDate(key);
                }.bind(valuecomp));
                valuecomp.addListener("onblur", function (arg) {
                    this.validateAndReformatDate(key);
                }.bind(valuecomp));
            }

            valuecomp.dkey = dkey;
            keycell.setText(dkey);
            if (found) {
                var val = data[dkey];
                valuecomp.setText(String(val));
            } else {
                valuecomp.setStyle("visibility", "hidden");
                keycell.setStyle("visibility", "hidden");
            }
            this.valuecomps[key] = valuecomp;
            this.titlecomps[key] = keycell;
        }
    }
}


var multilineui_count = 0;

///////////////////
class MultiLineUI {//constructor(data, parentcomp, customcomp) {this.createUI(data, parentcomp, customcomp);}

    constructor(parentcomp, order) {
        this.order = order;
        this.lineuis = [];
        this.table = new Table(parentcomp, "multiLineui_table" + multilineui_count);
        this.table.tablenumber = multilineui_count;
        multilineui_count++;
    }

    addRow(data) {
        var lineui = new LineUI(data, this.order, this.table);
        this.lineuis.push(lineui);
        return lineui;
    }

    addEmptyRow() {
        var lineui = new LineUI(undefined, this.order, this.table);
        this.lineuis.push(lineui);
        return lineui;
    }

    removeAll() {
        for (var i = 0; i < this.lineuis.length; i++) this.lineuis[i].remove();
        this.lineuis = [];
        this.table.selfRemove();
    }

    removeRow(rowobj) {
        for (var i = 0; i < this.lineuis.length; i++) if (this.lineuis[i] == rowobj) {
            rowobj.remove();
            this.lineuis.splice(i, 1);
            return;
        }
    }

    /*
        createUI(data, parentcomp, customcomp) {
            var customcomps = customcomp;
            this.lineui = new LineUI(data, customcomps);
            this.table = new Table(parentcomp, "blockinfo_table");
       //     this.table.setTableContent(this.lineui.getTableContent());
            this.table.setStyle("border", "none");
            this.table.setStyle("font-size", "100%");
            this.table.setStyle("margin-left", "25px");
        }
    */

    updateFile(datafile) {
        this.lineui.updatefile(data);
    }

    update(data) {
        this.lineui.update(data);
    }
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


///////////////////////////
class CommandButtonPanel {
    constructor(parentcomp, id) {
        this.id = id;
        this.buttons = [];
        this.parentcomp = parentcomp;
    }

    addButton(key, text, styles, callback, othercomp) {
        var comptouse = this.parentcomp;
        if (othercomp) comptouse = othercomp;
        var button = new Button(comptouse, this.id + "_" + key + "_button");
        for (var s in styles) button.setStyle(s, styles[s]);
        //   this.setbutton.setStyle("float","right");
        button.setText(text);
        button.setCallback(callback);
        button.mykey = key;
        this.buttons.push(button);
        return button;
    }

};


////////////////////
class TagProbabilityModel {
    constructor() {
        this.model = null;
        this.lastDataHash = null;
    }

    // Simple hash function to detect if data has changed
    hashData(datafile) {
        if (!datafile) return null;
        var hash = 0;
        for (var i = 0; i < datafile.length; i++) {
            hash = ((hash << 5) - hash) + datafile.charCodeAt(i);
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }

    // Build conditional probability model from all blocks in data.txt
    // Calculates P(tag | command) for all commands
    buildModel(datafile) {
        if (!datafile || typeof appConfig === 'undefined' || !appConfig.tags) {
            this.model = null;
            return;
        }

        if (DEBUG_PROBABILITY_MODEL) console.log("buildModel called, datafile length:", datafile ? datafile.length : 0);

        // Check if data has changed
        var currentHash = this.hashData(datafile);
        if (DEBUG_PROBABILITY_MODEL) console.log("Current hash:", currentHash, "Last hash:", this.lastDataHash);
        if (this.lastDataHash === currentHash && this.model) {
            if (DEBUG_PROBABILITY_MODEL) {
                console.log("=== Tag Probability Model ===");
                console.log("Data unchanged, skipping model rebuild");
            }
            return;
        }
        this.lastDataHash = currentHash;
        if (DEBUG_PROBABILITY_MODEL) {
            console.log("=== Tag Probability Model ===");
            console.log("Data changed, rebuilding model");
        }

        var lines = datafile.split('\n');
        var tags = appConfig.tags;
        var tagSet = {};
        tags.forEach(function(tag) { tagSet[tag] = true; });

        // Build co-occurrence matrix: commandTagPairs[command][tag] = count of blocks where both appear
        var commandTagPairs = {};
        var commandCounts = {}; // Individual command frequency

        // Build self-probability matrix: selfProbs[tag][n] = P(n+1 occurrences | n occurrences)
        var selfProbs = {};
        var tagOccurrenceCounts = {}; // tagOccurrenceCounts[tag][n] = count of blocks with exactly n occurrences

        // Initialize matrices
        for (var i = 0; i < lines.length; i++) {
            var parts = lines[i].split(',');
            if (parts.length >= 3) {
                var command = parts[2].trim();
                if (!commandTagPairs[command]) {
                    commandTagPairs[command] = {};
                    tags.forEach(function(tag) {
                        commandTagPairs[command][tag] = 0;
                    });
                    commandCounts[command] = 0;
                }
            }
        }

        // Initialize self-probability tracking
        tags.forEach(function(tag) {
            selfProbs[tag] = {};
            tagOccurrenceCounts[tag] = {};
        });

        // Group entries by block ID, respecting cancel commands
        var blockCommands = {};
        var blockTags = {};
        var blockCancelledCommands = {};
        for (var i = 0; i < lines.length; i++) {
            var parts = lines[i].split(',');
            if (parts.length >= 3) {
                var blockId = parts[1].trim();
                var command = parts[2].trim();
                var argument = parts.length >= 4 ? parts[3].trim() : "";

                if (command === "cancel") {
                    // Track cancelled commands per block
                    if (!blockCancelledCommands[blockId]) blockCancelledCommands[blockId] = {};
                    blockCancelledCommands[blockId][argument] = true;
                    // Remove from blockCommands if it was there
                    if (blockCommands[blockId]) {
                        var idx = blockCommands[blockId].indexOf(argument);
                        if (idx !== -1) {
                            blockCommands[blockId].splice(idx, 1);
                        }
                    }
                    // Remove from blockTags if it was there
                    if (blockTags[blockId]) {
                        var idx = blockTags[blockId].indexOf(argument);
                        if (idx !== -1) {
                            blockTags[blockId].splice(idx, 1);
                        }
                    }
                } else {
                    // Only add command if it hasn't been cancelled for this block
                    if (!blockCancelledCommands[blockId] || !blockCancelledCommands[blockId][command]) {
                        if (!blockCommands[blockId]) blockCommands[blockId] = [];
                        if (blockCommands[blockId].indexOf(command) === -1) {
                            blockCommands[blockId].push(command);
                        }
                        // Track tags separately with full count (not unique)
                        if (tagSet[command]) {
                            if (!blockTags[blockId]) blockTags[blockId] = [];
                            blockTags[blockId].push(command);
                        }
                    }
                }
            }
        }

        // Debug: print blocks with multiple fruit occurrences
        if (DEBUG_PROBABILITY_MODEL) console.log("=== Blocks with Multiple Fruit Occurrences ===");
        for (var blockId in blockTags) {
            var blockTagList = blockTags[blockId];
            var fruitCount = 0;
            for (var j = 0; j < blockTagList.length; j++) {
                if (blockTagList[j] === 'fruit') fruitCount++;
            }
            if (fruitCount > 1) {
                if (DEBUG_PROBABILITY_MODEL) console.log("Block " + blockId + " has " + fruitCount + " fruit(s): " + blockTagList.join(", "));
            }
        }

        if (DEBUG_PROBABILITY_MODEL) {
            console.log("=== Building Tag Probability Model ===");
            console.log("Found " + Object.keys(blockCommands).length + " blocks with commands");
            console.log("Sample blocks and their commands:");
        }
        var blockCount = 0;
        for (var blockId in blockCommands) {
            if (blockCount < 5) {
                if (DEBUG_PROBABILITY_MODEL) {
                    console.log("  Block " + blockId + " commands: " + blockCommands[blockId].join(", "));
                    console.log("  Block " + blockId + " tags: " + (blockTags[blockId] || []).join(", "));
                }
                blockCount++;
            }
        }

        // Count co-occurrences between commands and tags
        for (var blockId in blockCommands) {
            var blockCommandList = blockCommands[blockId];
            var blockTagList = blockTags[blockId] || [];

            // Count each command (for self-probability, count blocks with at least one occurrence)
            var commandCountsInBlock = {};
            for (var i = 0; i < blockCommandList.length; i++) {
                var command = blockCommandList[i];
                if (!commandCountsInBlock[command]) {
                    commandCountsInBlock[command] = true;
                    commandCounts[command]++;
                }
            }

            // Count co-occurrences: for each command in block, increment count for each tag in block
            for (var i = 0; i < blockCommandList.length; i++) {
                var command = blockCommandList[i];
                for (var j = 0; j < blockTagList.length; j++) {
                    var tag = blockTagList[j];
                    if (commandTagPairs[command]) {
                        commandTagPairs[command][tag]++;
                    }
                }
            }

            // Count tag occurrences for self-probability
            for (var i = 0; i < tags.length; i++) {
                var tag = tags[i];
                var count = 0;
                for (var j = 0; j < blockTagList.length; j++) {
                    if (blockTagList[j] === tag) count++;
                }
                if (!tagOccurrenceCounts[tag][count]) tagOccurrenceCounts[tag][count] = 0;
                tagOccurrenceCounts[tag][count]++;
            }
        }

        // Calculate conditional probabilities: P(tag | command) = count(command and tag) / count(command)
        var conditionalProbs = {};
        for (var command in commandTagPairs) {
            conditionalProbs[command] = {};
            tags.forEach(function(tag) {
                if (commandCounts[command] > 0) {
                    conditionalProbs[command][tag] = commandTagPairs[command][tag] / commandCounts[command];
                } else {
                    conditionalProbs[command][tag] = 0;
                }
            });
        }

        // Calculate self-probabilities: P(n+1 | n) = count with n+1 / count with n
        if (DEBUG_PROBABILITY_MODEL) console.log("=== Self-Probability Calculation for All Tags ===");
        for (var tag in tagOccurrenceCounts) {
            var counts = tagOccurrenceCounts[tag];
            var maxCount = 0;
            for (var n in counts) {
                if (parseInt(n) > maxCount) maxCount = parseInt(n);
            }

            if (DEBUG_PROBABILITY_MODEL) {
                console.log("Tag: " + tag);
                console.log("  Occurrence counts across all blocks:", counts);
            }
            for (var n in counts) {
                if (DEBUG_PROBABILITY_MODEL) console.log("    Blocks with " + n + " occurrence(s): " + counts[n]);
            }

            for (var n = 0; n <= maxCount; n++) {
                var countWithN = counts[n] || 0;
                var countWithNPlus1 = counts[n + 1] || 0;
                if (countWithN > 0) {
                    selfProbs[tag][n] = countWithNPlus1 / countWithN;
                    if (DEBUG_PROBABILITY_MODEL) console.log("    P(" + (parseInt(n)+1) + "|" + n + ") = " + countWithNPlus1 + " / " + countWithN + " = " + selfProbs[tag][n].toFixed(3));
                } else {
                    selfProbs[tag][n] = 0;
                }
            }
        }

        if (DEBUG_PROBABILITY_MODEL) {
            console.log("=== Tag Probability Model Build ===");
            console.log("Command counts:", commandCounts);
            console.log("Sample conditional probabilities (P(tag | command)):");
        }
        var sampleCount = 0;
        for (var command in conditionalProbs) {
            if (sampleCount < 15) {
                var sample = {};
                for (var tag in conditionalProbs[command]) {
                    if (conditionalProbs[command][tag] > 0) {
                        sample[tag] = conditionalProbs[command][tag].toFixed(3);
                    }
                }
                if (Object.keys(sample).length > 0) {
                    if (DEBUG_PROBABILITY_MODEL) console.log("  Given command '" + command + "':", sample);
                    sampleCount++;
                }
            }
        }

        // Print self-probabilities (transition probabilities)
        if (DEBUG_PROBABILITY_MODEL) console.log("Self-probabilities (P(n+1 occurrences | n occurrences)):");
        for (var i = 0; i < tags.length; i++) {
            var tag = tags[i];
            var probs = selfProbs[tag];
            var probStr = [];
            for (var n in probs) {
                if (probs[n] > 0) {
                    probStr.push("P(" + (parseInt(n)+1) + "|" + n + ")=" + probs[n].toFixed(3));
                }
            }
            if (probStr.length > 0) {
                if (DEBUG_PROBABILITY_MODEL) console.log("  " + tag + ": " + probStr.join(", "));
            }
        }

        this.model = {
            conditionalProbs: conditionalProbs,
            commandCounts: commandCounts,
            selfProbs: selfProbs
        };
    }

    // Predict next tag probability based on all commands in block history
    predictNextTag(blockHistory) {
        if (!this.model || typeof appConfig === 'undefined' || !appConfig.tags) return null;

        var tags = appConfig.tags;
        var tagSet = {};
        tags.forEach(function(tag) { tagSet[tag] = true; });
        var blockCommands = this.extractCommandsFromBlockHistory(blockHistory);

        if (DEBUG_PROBABILITY_MODEL) {
            console.log("=== Tag Prediction for Current Block ===");
            console.log("Block history:", blockHistory);
            console.log("Extracted commands from block:", blockCommands);
        }

        // Count occurrences of each tag in the block
        var tagCounts = {};
        for (var i = 0; i < blockCommands.length; i++) {
            var command = blockCommands[i];
            if (tagSet[command]) {
                if (!tagCounts[command]) tagCounts[command] = 0;
                tagCounts[command]++;
            }
        }
        if (DEBUG_PROBABILITY_MODEL) console.log("Tag occurrence counts in block:", tagCounts);

        // If block has no commands, use individual tag frequency
        if (blockCommands.length === 0) {
            if (DEBUG_PROBABILITY_MODEL) console.log("Block has no commands - using uniform probability");
            var probabilities = {};
            tags.forEach(function(tag) {
                probabilities[tag] = 1 / tags.length;
            });
            if (DEBUG_PROBABILITY_MODEL) console.log("Uniform probabilities:", probabilities);
            return probabilities;
        }

        // Combine conditional probabilities from all commands using log-linear pooling
        // Log-linear pooling: P_final(tag) ∝ ∏ P_i(tag)
        var probabilities = {};
        tags.forEach(function(tag) {
            probabilities[tag] = 1; // Start with 1 for multiplication
        });

        if (DEBUG_PROBABILITY_MODEL) console.log("Calculating conditional probabilities for each command:");
        // Use unique commands for log-linear pooling (don't multiply same command multiple times)
        var uniqueCommands = [];
        var seenCommands = {};
        for (var i = 0; i < blockCommands.length; i++) {
            var command = blockCommands[i];
            if (!seenCommands[command]) {
                seenCommands[command] = true;
                uniqueCommands.push(command);
            }
        }
        if (DEBUG_PROBABILITY_MODEL) console.log("Using unique commands:", uniqueCommands);

        for (var i = 0; i < uniqueCommands.length; i++) {
            var command = uniqueCommands[i];
            if (DEBUG_PROBABILITY_MODEL) console.log("  For command '" + command + "':");
            if (this.model.conditionalProbs[command]) {
                for (var j = 0; j < tags.length; j++) {
                    var tag = tags[j];
                    var prob = this.model.conditionalProbs[command][tag];

                    // For self-probability, use occurrence-based transition probability
                    if (command === tag) {
                        var currentCount = tagCounts[tag] || 0;
                        var selfProb = this.model.selfProbs[tag][currentCount] || 0;
                        prob = selfProb;
                        if (DEBUG_PROBABILITY_MODEL) {
                            console.log("    P(" + tag + "|" + command + ") = " + prob.toFixed(3) + " [SELF using P(" + (currentCount+1) + "|" + currentCount + ")]");
                            // Debug: print all self-probabilities for this tag
                            console.log("    All self-probabilities for " + tag + ":", this.model.selfProbs[tag]);
                        }
                    } else {
                        if (prob > 0) {
                            if (DEBUG_PROBABILITY_MODEL) console.log("    P(" + tag + "|" + command + ") = " + prob.toFixed(3));
                        }
                    }

                    // Use a small epsilon to avoid zero multiplication (Bayesian smoothing)
                    var smoothProb = Math.max(prob, 0.001);
                    probabilities[tag] *= smoothProb;
                }
            } else {
                if (DEBUG_PROBABILITY_MODEL) console.log("    No probability data for command '" + command + "'");
            }
        }

        // Normalize the probabilities (log-linear pooling)
        if (DEBUG_PROBABILITY_MODEL) console.log("Normalizing probabilities (log-linear pooling):");
        var total = 0;
        for (var tag in probabilities) {
            total += probabilities[tag];
        }
        for (var tag in probabilities) {
            probabilities[tag] = probabilities[tag] / total;
        }

        // Print final probabilities
        if (DEBUG_PROBABILITY_MODEL) console.log("Final probabilities:");
        for (var tag in probabilities) {
            if (probabilities[tag] > 0.001) {
                if (DEBUG_PROBABILITY_MODEL) console.log("  " + tag + ": " + probabilities[tag].toFixed(3));
            }
        }

        return probabilities;
    }

    // Extract all commands from a single block's history string, respecting cancel commands
    // Returns array with duplicates (to count occurrences)
    extractCommandsFromBlockHistory(historyString) {
        if (!historyString) return [];
        var lines = historyString.split('\n');
        var foundCommands = [];
        var cancelledCommands = {};

        // Process history in order, tracking cancellations
        for (var i = 0; i < lines.length; i++) {
            var parts = lines[i].split(',');
            if (parts.length >= 3) {
                var command = parts[2].trim();
                var argument = parts.length >= 4 ? parts[3].trim() : "";

                if (command === "cancel") {
                    // Mark the cancelled command
                    cancelledCommands[argument] = true;
                    // Remove all occurrences of cancelled command from foundCommands
                    for (var j = foundCommands.length - 1; j >= 0; j--) {
                        if (foundCommands[j] === argument) {
                            foundCommands.splice(j, 1);
                        }
                    }
                } else if (!cancelledCommands[command]) {
                    // Only add command if it hasn't been cancelled
                    foundCommands.push(command);
                }
            }
        }

        return foundCommands;
    }

    // Extract tags from a single block's history string, respecting cancel commands
    extractTagsFromBlockHistory(historyString) {
        if (!historyString || typeof appConfig === 'undefined' || !appConfig.tags) return [];
        var lines = historyString.split('\n');
        var tagSet = {};
        appConfig.tags.forEach(function(tag) { tagSet[tag] = true; });
        var foundTags = {};
        var cancelledCommands = {};

        // Process history in order, tracking cancellations
        for (var i = 0; i < lines.length; i++) {
            var parts = lines[i].split(',');
            if (parts.length >= 3) {
                var command = parts[2].trim();
                var argument = parts.length >= 4 ? parts[3].trim() : "";

                if (command === "cancel") {
                    // Mark the cancelled command
                    cancelledCommands[argument] = true;
                    // Also remove from foundTags if it was there
                    if (foundTags[argument]) {
                        delete foundTags[argument];
                    }
                } else if (tagSet[command] && !cancelledCommands[command]) {
                    // Only add tag if it hasn't been cancelled
                    foundTags[command] = true;
                }
            }
        }

        return Object.keys(foundTags);
    }
}


////////////////////
class CommandLineUI {
    constructor(data) {
        this.data = data;
    }

    addAsRow(multilineui, skipCell) {
        this.row = multilineui.addRow(this.data);
        // Multi/pile rows host their buttons in a cell appended to the data row,
        // while the main command row hosts its buttons in dedicated cells. In that
        // case skipCell avoids appending an extra (empty) cell to the row, but the
        // panel must still exist because getCompIds() reads buttonpanel.buttons.
        if (skipCell) {
            this.buttonpanel = new CommandButtonPanel(undefined, this.row.id + "buttonpanel");
        } else {
            var cell = this.row.addCell();
            this.buttonpanel = new CommandButtonPanel(cell, cell.id + "multlinebuttonpanel");
        }
        return this.row;
    }

    update(data) {
        this.data = data;
        this.row.update(data);
    }

    updateFile(datafile) {
        this.datafile = datafile;
        this.row.updateFile(datafile);
    }

    getClearUrl() {
        return "/clear";
    }

    getCompIds() {
        var comps = [];
        for (var k in this.row.valuecomps) comps.push(this.row.valuecomps[k].id);
        for (var k in this.buttonpanel.buttons) comps.push(this.buttonpanel.buttons[k].id);
        return comps;
    }

    getArgURL() {
        // check each field that it matches the data        // console.log("MultiLineButtonSpan::getArguments");
        var argtext = "";
        for (var k in this.row.valuecomps) {
            var utext = this.row.valuecomps[k].getUserInput();
            if (utext !== undefined && utext != this.data[k]) {
                if (argtext.length > 0) argtext += "&"; else argtext += "?";
                argtext += this.row.valuecomps[k].dkey + "=" + encodeURIComponent(utext);
            }
        }
        return argtext;
    }

    getFullArgURL() {
        // check each field that it matches the data        // console.log("MultiLineButtonSpan::getArguments");
        var argtext = "";
        for (var k in this.row.valuecomps) {
            var utext = this.row.valuecomps[k].getUserInput();
            var ctext = this.row.valuecomps[k].text;
            if (utext === undefined || utext.length == 0) utext = ctext;
            if (utext.length != 0) {
                if (argtext.length > 0) argtext += "&"; else argtext += "?";
                argtext += this.row.valuecomps[k].dkey + "=" + encodeURIComponent(utext);
            }
        }
        return argtext;
    }
}


/////////////////////
////////////////////
class CommandMultiUI {
    constructor(data, title, noadd, order) {
        this.noadd = noadd;
        this.title = title;
        this.data = data;
        this.order = order;
        this.init = false;
        this.commandlineuis = [];//{};
        this.urls = {
            clearAll: "/multiClear",
            addCurrent: "/multiPush",
            set: "/multiSet",
            clear: "/multiClear",
        };
    }

    update(data) {
        this.data = data;
        var max = this.getDataMaxIndex();
        var min = this.getDataMinIndex();
        if (min < 0 || max < 0) {
            this.removeAll();
            return;
        }
        for (var i = min; i <= max; i++) {
            if (i >= this.commandlineuis.length) this.addRow(i);
            if (!this.commandlineuis[i]) {
                Console.log("problem here");
            } else
                this.commandlineuis[i].update(this.getDataSubset(i));
        }
        if (this.commandlineuis.length - 1 > max) {
            this.removeFromLine(max + 1);
        }
    }

    removeFromLine(l) {
        for (var i = l; i < this.commandlineuis.length;) {
            if (this.multilineui) {
                this.multilineui.removeRow(this.commandlineuis[i].row);
                //this.commandlineuis[i].remove();
                this.commandlineuis.splice(i, 1);
            } else i++;
        }
    }

    removeAll() {
        this.removeFromLine(1);
    }

    updateFile(datafile) {
        for (var i = 0; i < this.commandlineuis.length; i++) {
            if (this.commandlineuis[i]) {
                this.commandlineuis[i].updateFile(datafile);
            }
        }
    }

    initCreate(multilineui) {
      //  this.setbstyle = {"font-size": "100%", "margin-left": "5px","margin-right":"30px"};
        this.clearbstyle = {"font-size": "60%", "margin-left": "15px","padding-top": "3px", "padding-bottom": "3px"};
        this.clearbstyle2 = {"font-size": "60%", "margin-left": "3px","padding-top": "3px", "padding-bottom": "3px"};
        this.multilineui = multilineui;
        var row = multilineui.addEmptyRow();
        var cell = row.addCell();
        cell.setText(this.title);
        cell.setStyle("font-size", "80%");
        cell.setStyle("font-weight", "bold");
        cell.setStyle("color", "darkgray");
        cell.setStyle("padding-top", "12px");

        cell.setAttribute("colspan","9");

        // Exposed so CommandUI.createMultiCheckbox() has a valid parent to attach to.
        this.cell = cell;
    //    var cell = row.addCell();
    //    cell.setStyle("padding-top", "12px");

   //     var cell25 = row.addCell();
   //     var cell3 = row.addCell();
   //     cell3.setStyle("padding-top", "12px");
   //     cell3.setStyle("white-space", "no-wrap");
   //     var cell35 = row.addCell();
   //     var cell4 = row.addCell();
   //     cell4.setStyle("padding-top", "12px");
   //     this.extracell = cell4;
        // Placeholder cell on the multi header row: when multi holds no entries the pile
        // section is moved in here so it sits on the same line, right of the multi controls.
       // this.pilecell = row.addCell({"vertical-align": "top", "padding-left": "15px"});
        this.pilecell=cell;
        var extrastyles = {/*"width": "100%",*/ "padding-top": "3px", "padding-bottom": "3px"};
        if (!this.noadd) {
            this.genbuttonpanel = new CommandButtonPanel(cell, cell.id + "multlinegenbuttonpanel");
            this.genbuttonpanel.addButton("addCurrent", "add +", Object.assign({}, this.clearbstyle, extrastyles), this.addCurrent.bind(this));
        }
        this.genbuttonpanel = new CommandButtonPanel(cell, cell.id + "multlinegenbuttonpanel");

        this.genbuttonpanel.addButton("clearAll", "clear all x",this.clearbstyle2, this.clearAll.bind(this));

    }

    addRows(multilineui) {
        if (!this.init) {
            this.init = true;
            this.initCreate(multilineui);
        }
        var max = this.getDataMaxIndex();
        var min = this.getDataMinIndex();
        if (max < 0 || min < 0) return;
        for (var i = min; i <= max; i++) this.addRow(i);           //            clineui.buttonpanel.addButton("load", "load x", clearbstyle,this.load.bind(this));
    }

    addRow(i) {
        var clineui = new CommandLineUI(this.getDataSubset(i));
        var line = clineui.addAsRow(this.multilineui);
        line.row.setStyle("border", "solid lightgray 1px");
        line.row.setStyle("font-size", "85%");
        this.setbstyle = {"font-size": "75%", "margin-left": "5px","margin-right":"5px"};
        clineui.buttonpanel.addButton("set", "set -", this.setbstyle, this.set.bind(this, i));
        clineui.buttonpanel.addButton("clear", "clear x", this.setbstyle, this.clear.bind(this, i));
        this.commandlineuis[i] = clineui;

        // Add Enter key listeners to all fields in this multi row
        var self = this;
        for (var key in line.valuecomps) {
            line.valuecomps[key].addListener("onkeyup",
                (function (rowIndex) {
                    return function (arg) {
                        if (arg.key == "Enter") {
                            self.set(rowIndex);
                        }
                    };
                })(i));
        }
    }

    getDataMaxIndex() {
        var max = -1;
        for (var k in this.data) {
            var mi = Number(this.getMultiindex(k));
            if (max < mi) max = mi;
        }
        return max;
    }

    getDataMinIndex() {
        var min = -1;
        for (var k in this.data) {
            var mi = Number(this.getMultiindex(k));
            if (min < 0 || min > mi) min = mi;
        }
        return min;
    }

    getDataSubset(i) {
        var subset = {};
        for (var s in this.data) {
            var mindex = this.getMultiindex(s);
            if (mindex == i) subset[s] = this.data[s];
        }
        ;
        return subset;
    }

    getMultiindex(s) {
        var end = s.lastIndexOf("/");
        var start = s.lastIndexOf("/", end - 1);
        if (start < 0) start = 0; else start++;
        if (end >= 0) return s.substring(start, end);
        else return -1;
    };

    getCompIds() {
        var ids = [];//
        for (var b in this.genbuttonpanel.buttons) ids.push(this.genbuttonpanel.buttons[b].id);  //buttons ids
        for (var i in this.commandlineuis) ids = ids.concat(this.commandlineuis[i].getCompIds());  //fields ids
        return ids;
    }


    clearAll(rowindex) {
        console.log("CommandMultiUI::clearAll");
        disenableload(this.urls["clearAll"], this.getCompIds());
    }

    addCurrent() {
        console.log("CommandMultiUI::addCurrent");
        disenableload(this.urls["addCurrent"], this.getCompIds());
    }

    set(rowindex) {
        console.log("CommandMultiUI::set");
        var row = this.commandlineuis[rowindex].row;
        var commandField = row.valuecomps["command"];
        var currentCommand = commandField.getUserInput() || commandField.text;
        var commandContainsDate = currentCommand && currentCommand.toLowerCase().includes("date");

        if (commandContainsDate) {
            var dateField = row.valuecomps["date"];
            var argumentField = row.valuecomps["argument"];

            // Check if date field is invalid (has red background)
            if (dateField && dateField.activebgcolor === "#ffe6e6") {
                alert("Cannot set: date field is invalid !");
                console.log("Cannot set: date field is invalid");
                return;
            }

            // Check if argument field is invalid (has red background)
            if (argumentField && argumentField.activebgcolor === "#ffe6e6") {
                alert("Cannot set: argument field is invalid !");
                console.log("Cannot set: argument field is invalid");
                return;
            }
        }

        var args = this.commandlineuis[rowindex].getArgURL();
        if (args) disenableload(this.urls["set"] + args, this.commandlineuis[rowindex].getCompIds());
    }

    clear(rowindex) {
        console.log("CommandMultiUI::clear");
        disenableload(this.urls["clear"] + "?path=" + rowindex, this.commandlineuis[rowindex].getCompIds());
    }
};


/////////////////////
/////////////////////
class CommandPileUI {
    constructor(data, config, parentcomp, order) {
        this.create(data, config, parentcomp, order);
    }

    create(data, config, parentcomp, order) {
        this.configdata = config;
        this.comp = new DivItem(parentcomp, "pilefieldset", "fieldset");
        this.comp.setStyle("padding", 0);

        parentcomp = this.comp;
        this.clearbstyle = {"font-size": "60%", "margin": "2px"};
        this.titlediv = new DivItem(parentcomp);
        this.titlediv.setStyle("margin-top", "15px");
        this.titletextcomp = new SimpleText(this.titlediv, "piletitle", "Pile");
        this.titletextcomp.setStyle("font-size", "75%");
        this.titletextcomp.setStyle("margin-right", "3px");
       // this.titletextcomp.setStyle("margin-left", "40px");
        this.titletextcomp.setStyle("font-weight", "bold");
        this.titletextcomp.setStyle("color", "darkgray");

        this.pilebuttonpanel = new CommandButtonPanel(this.titlediv, this.titlediv.id + "pilebuttonpanel");
        this.pilebuttonpanel.addButton("addCurrent", "add to pile +", this.clearbstyle, this.addPile.bind(this));
        this.pilebuttonpanel.addButton("clearAll", "clear pile x", this.clearbstyle, this.clearPile.bind(this));

        this.usepilecheckbox = new CheckBox(this.titlediv, "pilecheckbox");
        var usepiletext = new SimpleText(this.titlediv, "pilecheckboxtext", "use pile")
        usepiletext.setStyle("font-size", "60%");
        this.usepilecheckbox.setStyle("margin-left", "15px");
        this.usepilecheckbox.setStyles({"position": "relative", "top": "3px"});
        if (data["configstate"]) if (this.configdata["pile"]) this.usepilecheckbox.setText(1);
        this.usepilecheckbox.pchecked = this.usepilecheckbox.element.checked;
        this.usepilecheckbox.addListener("onchange", this.pileuse.bind(this));

        this.fifocheckbox = new CheckBox(this.titlediv, "fifocheckbox");
        var fifotext = new SimpleText(this.titlediv, "fifocheckboxtext", "fifo");
        fifotext.setStyle("font-size", "60%");
        if (this.configdata["fifo"]) this.fifocheckbox.setText(1);
        fifotext.setStyle("margin-right", "5px");
        this.fifocheckbox.setStyle("font-size", "60%");
        this.fifocheckbox.setStyle("margin-left", "10px");
        this.fifocheckbox.setStyles({"position": "relative", "top": "3px"});
        this.fifocheckbox.pchecked = this.fifocheckbox.element.checked;
        this.fifocheckbox.addListener("onchange", this.fifo.bind(this));

        this.bigtable = new Table(parentcomp, "commandpileuibigtable");
        this.bigtable.setStyle("border", "none");  //this.bigtable.setStyle("border", "solid lightgray 2px"); // this.bigtable.setStyle("margin-top", "15px");   //  this.multilineui.table.setStyle("border", "solid lightgray 5px");
        this.data = data;
        var min = this.getPileMinIndex(), max = this.getPileMaxIndex();
        this.commandmultiuis = [];
        this.multilineui = [];
        this.order = order;
        if (min < 0 || max < 0) return;
        for (var i = min; i <= max; i++) {
            this.createEntry(i);
        }
    }

    pileuse() {
        if (this.updating) return;
        if (this.usepilecheckbox.pchecked == this.usepilecheckbox.element.checked) return;
        console.log("CommandPileUI::pileuse");
        var v = 0;
        if (this.usepilecheckbox.element.checked) v = 1;
        this.usepilecheckbox.pchecked = v;
        disenableload("/set?pile=" + v, [this.usepilecheckbox.id]);
    }

    fifo() {
        if (this.updating) return;
        if (this.fifocheckbox.pchecked == this.fifocheckbox.element.checked) return;
        console.log("CommandPileUI::fifo");
        var v = 0;
        if (this.fifocheckbox.element.checked) v = 1;
        this.fifocheckbox.pchecked = v;
        disenableload("/set?fifo=" + v, [this.fifocheckbox.id]);
    }

    createEntry(i) {
        var row = this.bigtable.addRow();
        var cell = this.bigtable.addCell(row.index);
        this.multilineui[i] = new MultiLineUI(cell, this.order);
        var subset = this.getDataSubset(i);
        this.commandmultiuis[i] = new CommandMultiUI(subset, "p" + i, 1);
        this.commandmultiuis[i].addRows(this.multilineui[i]);
        let buttons = this.commandmultiuis[i].genbuttonpanel.buttons;
        this.commandmultiuis[i].genbuttonpanel.addButton("pop", "pop ^", this.commandmultiuis[i].clearbstyle, this.popPile.bind(this, i));
        for (var b in buttons) {
            if (buttons[b].mykey == "clearAll") buttons[b].setCallback(this.clearLinePile.bind(this, i));
        }
        let lines = this.commandmultiuis[i].commandlineuis;
        var self = this;
        for (var l in lines) {
            //     lines[l].buttonpanel.addButton("pop", "pop ^", this.commandmultiuis[i].clearbstyle, this.pop.bind(this,i,l));
            let buttons = lines[l].buttonpanel.buttons;
            for (var b in buttons) {
                if (buttons[b].mykey == "set") buttons[b].setCallback(this.setPile.bind(this, i, l));
                if (buttons[b].mykey == "clear") buttons[b].setCallback(this.clearLinePile.bind(this, i, l));
            }
            // Add Enter key listeners to all fields in this pile line
            for (var key in lines[l].row.valuecomps) {
                lines[l].row.valuecomps[key].addListener("onkeyup",
                    (function (rowIndex, lineIndex) {
                        return function (arg) {
                            if (arg.key == "Enter") {
                                self.setPile(rowIndex, lineIndex);
                            }
                        };
                    })(i, l));
            }
        }
    }

    removeAll() {
        removeAllFrom(0);
    }

    removeAllFrom(start) {
        for (let i = this.multilineui.length - 1; i >= start; i--) {
            this.multilineui[i].removeAll();
            //this.multilineui[i]=null;
            this.multilineui.splice(i, 1);
            //this.commandmultiuis[i]=null;
            this.commandmultiuis.splice(i, 1);
        }
    }

    updateFile(datafile) {
        for (var i = 0; i < this.commandmultiuis.length; i++) {
            if (this.commandmultiuis[i]) {
                this.commandmultiuis[i].updateFile(datafile);
            }
        }
    }

    update(data, config) {
        this.updating = true;
        geid("pilefieldset").disabled = false;
        this.data = data;
        this.configdata = config;
        var min = this.getPileMinIndex(), max = this.getPileMaxIndex();
        if (min >= 0 && max >= 0) {
            for (var i = min; i <= max; i++) {
                var subset = this.getDataSubset(i);
                if (!this.commandmultiuis[i]) this.createEntry(i);
                else this.commandmultiuis[i].update(subset);
            }
        }
        if (max < 0) this.removeAllFrom(0);
        else this.removeAllFrom(max + 1);
        var upc = 0;
        if (this.configdata["pile"] == 1) upc = 1;
        this.usepilecheckbox.updateText(upc);
        this.usepilecheckbox.pchecked = upc;
        var fc = 0;
        if (this.configdata["fifo"] == 1) fc = 1;
        this.fifocheckbox.updateText(fc);
        this.fifocheckbox.pchecked = fc;

        this.updating = false;
    }


    clearLinePile(rowindex, lineindex) {
        console.log("CommandMultiUI::clearLinePile");
        if (lineindex) disenableload("/pileClear?path=" + rowindex + "/" + lineindex, ["pilefieldset"]);
        else disenableload("/pileClear?path=" + rowindex, ["pilefieldset"]);
    }

    popPile(rowindex) {
        console.log("CommandMultiUI::popPile");
        disenableload("/pilePop?path=" + rowindex, ["pilefieldset"]);
    }

    setPile(rowindex, lineindex) {
        console.log("CommandMultiUI::set");
        var row = this.commandmultiuis[rowindex].commandlineuis[lineindex].row;
        var commandField = row.valuecomps["command"];
        var currentCommand = commandField.getUserInput() || commandField.text;
        var commandContainsDate = currentCommand && currentCommand.toLowerCase().includes("date");

        if (commandContainsDate) {
            var dateField = row.valuecomps["date"];
            var argumentField = row.valuecomps["argument"];

            // Check if date field is invalid (has red background)
            if (dateField && dateField.activebgcolor === "#ffe6e6") {
                alert("Cannot set: date field is invalid !");
                console.log("Cannot set: date field is invalid");
                return;
            }

            // Check if argument field is invalid (has red background)
            if (argumentField && argumentField.activebgcolor === "#ffe6e6") {
                alert("Cannot set: argument field is invalid !");
                console.log("Cannot set: argument field is invalid");
                return;
            }
        }

        var args = this.commandmultiuis[rowindex].commandlineuis[lineindex].getArgURL();
        disenableload("/pileEdit" + args, ["pilefieldset"]);
    }

    clearPile() {
        console.log("CommandMultiUI::clear");
        disenableload("/pileClear", ["pilefieldset"]);
    }

    addPile() {
        console.log("CommandMultiUI::addpile")
        disenableload("/pilePush", ["pilefieldset"]);
    }


    getDataSubset(i) {
        var subset = {};
        for (var s in this.data) {
            var mindex = this.getPileindex(s);
            if (mindex == i) subset[s] = this.data[s];
        }
        ;
        return subset;
    }

    getPileindex(s) {
        var end = s.indexOf("/");
        if (end > 0) return s.substring(1, end);
        else return -1;
    };

    getPileMaxIndex() {
        var max = -1;
        for (var k in this.data) {
            var mi = Number(this.getPileindex(k));
            if (max < mi) max = mi;
        }
        return max;
    }

    getPileMinIndex() {
        var min = -1;
        for (var k in this.data) {
            var mi = Number(this.getPileindex(k));
            if (min < 0 || min > mi) min = mi;
        }
        return min;
    }
};


function createButton(comp, id, styles, text, callback, key) {
    var button = new Button(comp, id + "_" + key + "_button");
    for (var s in styles) button.setStyle(s, styles[s]);
    button.setText(text);
    button.setCallback(callback);
    button.mykey = key;
    return button;
}


/////////////////
////////////////
var currentcommandUI;

class CommandUI {
    constructor(data, parentcomp) {
        this.tagProbabilityModel = new TagProbabilityModel(); // Store the probability model
        this.create(data, parentcomp);
        currentcommandUI = this;
    }

    getDataOrder(data) {
        return Object.keys(data["data"]);
    }

    createMultiCheckbox(comp, data) {
        this.multicheckbox = new CheckBox(comp, "multicheckbox");
        var multitext = new SimpleText(comp, "multicheckboxtext", "auto-multi");
        multitext.setStyle("font-size", "55%");
        //    saveonsettext.setStyle("float","right");
        //     this.multicheckbox.setStyle("float","right");
        multitext.setStyle("margin-right","25px");
        //    this.multicheckbox.setStyle("margin-left","25px");
        //   this.multicheckbox.setStyle("margin-top","7px");
        //   this.multicheckbox.setStyle("margin-bottom","10px");
           this.multicheckbox.setStyle("position","relative");
        this.multicheckbox.setStyle("position","relative");
        this.multicheckbox.setStyle("top", "2px");
        if (data["configstate"]) if (data["configstate"]["multi"]) this.multicheckbox.setText(1);
        this.multicheckbox.pchecked = this.multicheckbox.element.checked;
        this.multicheckbox.addListener("onchange", this.multiChanged.bind(this));
    }

    create(data, parentcomp) {
        //   this.lncomp=new SimpleBR(parentcomp);
        this.comp = new DivItem(parentcomp);
        this.title = createTitle(this.comp, "Command");
        //  this.lncomp2=new SimpleBR(this.comp);        // we need one datafield per variable and titles above - > table ?       // date, id, argument      // this.line=new Span(this.comp);       //this.objdata=[];

        this.commandDataList = new DataList(this.comp, "datalist_command");
        this.argumentDataList = new DataList(this.comp, "datalist_argument");

        var buttonstyle = {"font-size": "80%", "margin-top": "5px", "padding-left": "10px", "padding-right": "10px"},
            clearbstyle = {"font-size": "60%", "margin": "5px", "margin-top": "5px"}
        this.clearallbutton = createButton(this.comp, this.id + "_clearall_button", clearbstyle, "clear everything X", this.cleareverything.bind(this), "clearall");
        this.clearallbutton.setStyle("margin-left", "5px");
        this.clearallbutton.setStyle("margin-bottom", "10px");


        this.saveonsetcheckbox = new CheckBox(this.comp, "saveonsetcheckbox");
        var saveonsettext = new SimpleText(this.comp, "saveonsetcheckboxtext", "save on set");
        saveonsettext.setStyle("font-size", "65%");    //    saveonsettext.setStyle("float","right");   //     this.saveonsetcheckbox.setStyle("float","right");
        this.saveonsetcheckbox.setStyles({"position": "relative", "top": "3px"});
        this.saveonsetcheckbox.setStyle("margin-left", "25px");
        this.saveonsetcheckbox.setStyle("margin-top", "7px");
        this.saveonsetcheckbox.setStyle("margin-bottom", "10px");
        this.saveonsetcheckbox.setStyle("font-size", "65%");
        if (data["configstate"]) if (data["configstate"]["save-on-set"]) this.saveonsetcheckbox.setText(1);
        this.saveonsetcheckbox.pchecked = this.saveonsetcheckbox.element.checked;
        this.saveonsetcheckbox.addListener("onchange", this.saveonset.bind(this));

        this.restorebutton = createButton(this.comp, this.id + "restore_button", clearbstyle, "restore harvest setup", this.restore.bind(this), "restore");
        this.restorebutton.setStyle("margin-left", "15px");
        this.restorebutton.setStyle("margin-bottom", "10px")

        this.generateidbutton = createButton(this.comp, this.id + "generateid_button", clearbstyle, "Generate ID", this.generateid.bind(this), "generateID");
        this.generateidbutton.setStyle("margin-left", "15px");
        this.generateidbutton.setStyle("margin-bottom", "10px")

        this.disablegeneratecheckbox = new CheckBox(this.comp, "disablegeneratecheckbox");
        var disablegeneratetext = new SimpleText(this.comp, "disablegeneratecheckboxtext", "disable id generation");
        disablegeneratetext.setStyle("font-size", "65%");    //    disablegeneratetext.setStyle("float","right");   //     this.disablegeneratecheckbox.setStyle("float","right");
        this.disablegeneratecheckbox.setStyles({"position": "relative", "top": "3px"});
        this.disablegeneratecheckbox.setStyle("margin-left", "25px");
        this.disablegeneratecheckbox.setStyle("margin-top", "7px");
        this.disablegeneratecheckbox.setStyle("margin-bottom", "10px");
        this.disablegeneratecheckbox.setStyle("font-size", "65%");
        if (data["configstate"]) if (data["configstate"]["disable-generate"]) this.disablegeneratecheckbox.setText(1);
        this.disablegeneratecheckbox.pchecked = this.disablegeneratecheckbox.element.checked;
        this.disablegeneratecheckbox.addListener("onchange", this.disablegenerate.bind(this));

        this.disablerfididsavecheckbox = new CheckBox(this.comp, "disablerfididsavecheckbox");
        var disablerfididsavetext = new SimpleText(this.comp, "disablerfididsavecheckboxtext", "disable save on rfid/id association");
        disablerfididsavetext.setStyle("font-size", "65%");
        this.disablerfididsavecheckbox.setStyles({"position": "relative", "top": "3px"});
        this.disablerfididsavecheckbox.setStyle("margin-left", "25px");
        this.disablerfididsavecheckbox.setStyle("margin-top", "7px");
        this.disablerfididsavecheckbox.setStyle("margin-bottom", "10px");
        this.disablerfididsavecheckbox.setStyle("font-size", "65%");
        if (data["configstate"]) if (data["configstate"]["disable-rfid-id-save"]) this.disablerfididsavecheckbox.setText(1);
        this.disablerfididsavecheckbox.pchecked = this.disablerfididsavecheckbox.element.checked;
        this.disablerfididsavecheckbox.addListener("onchange", this.disablerfididsave.bind(this));


        var order = this.getDataOrder(data);
        this.multilineui = new MultiLineUI(this.comp, order);
        this.multilineui.table.setStyle("border", "none");
        this.commandlineui = new CommandLineUI(data["data"]);

        var lineui = this.commandlineui.addAsRow(this.multilineui, true);
        lineui.row.setStyle("border", "solid lightgray 1px");
        var newrow = this.multilineui.addEmptyRow();
        var cell1 = newrow.addCell();
        var cell2 = newrow.addCell();
        var cell3 = newrow.addCell();
        var cell4 = newrow.addCell();
        var cell5 = newrow.addCell();
        var cell6 = newrow.addCell();
        var cell7 = newrow.addCell();
        var cell8 = newrow.addCell();
        var extrastyles = {"padding-top": "4px", "padding-bottom": "4px", "margin-top": "7px"};
        var extrastyles2 = {
            "padding-top": "4px",
            "padding-bottom": "4px",
            "width": "100%",
            "margin-top": "5px",
            "margin-left": "0px",
            "font-size": "100%"
        };
        var newstyle = {};

        // Add recent IDs select before the set button
        var cellIdSelect = newrow.addCell();
        this.idSelect = new Select(cellIdSelect, "id_select");
        this.idSelect.setStyle("font-size", "70%");
        this.idSelect.setStyle("margin-right", "5px");
        this.idSelect.element.title = "Recent IDs";
        this.idSelect.addListener("onchange", this.onIdSelectChange.bind(this));

        this.buttonpanel = new CommandButtonPanel(cell1, cell1.id + "multlinebuttonpanel");
        this.commandlineui.buttonpanel.addButton("set", "set ✏️", Object.assign({}, buttonstyle, extrastyles2), this.set.bind(this), cell4);
        this.commandlineui.buttonpanel.addButton("save", "save 💾", Object.assign({}, buttonstyle, extrastyles), this.save.bind(this), cell6);
        this.commandlineui.buttonpanel.addButton("undo", "undo ↺", Object.assign({}, buttonstyle, extrastyles), this.undo.bind(this), cell7);
        this.commandlineui.buttonpanel.addButton("clear", "clear 🧹", Object.assign({}, buttonstyle, extrastyles), this.clear.bind(this), cell8);

        // Initial tag order based on current block history (or default if no model yet)
        var history = data["blockinfo"] ? data["blockinfo"]["history"] : "";
        var sortedTags = appConfig.tags;
        var probs = this.tagProbabilityModel.predictNextTag(history);
        if (probs) {
            sortedTags = appConfig.tags.slice().sort(function(a, b) {
                // Sort by probability descending, but zero-probability tags go to the end
                var probA = probs[a] || 0;
                var probB = probs[b] || 0;
                if (probA === 0 && probB === 0) return 0;
                if (probA === 0) return 1; // a goes to end
                if (probB === 0) return -1; // b goes to end
                return probB - probA; // higher probability first
            });
            if (DEBUG_PROBABILITY_MODEL) {
                console.log("=== Initial Tag Order ===");
                console.log("Sorted tags with probabilities:");
                for (var i = 0; i < sortedTags.length; i++) {
                    console.log("  " + (i+1) + ". " + sortedTags[i] + " (probability: " + (probs[sortedTags[i]] || 0).toFixed(3) + ")");
                }
            }
        }
        this.createTagButtons(sortedTags, data["configstate"]);

        this.commandmultiui = new CommandMultiUI(data["multi"], "Multi");
        this.commandmultiui.addRows(this.multilineui);
        this.createMultiCheckbox(this.commandmultiui.cell, data);

        if (data["pile"]) {
            this.commandpileui = new CommandPileUI(data["pile"], data["configstate"], this.comp, order);
            var bypassButton = this.commandpileui.pilebuttonpanel.addButton("bypass", "bypass ..", this.commandpileui.clearbstyle, this.bypass.bind(this));
            bypassButton.setAttribute("title", "Bypass set: writes the entered values straight into the current entry, skipping the multi-command queue, the pile/undo snapshot and the save-on-set auto-save (nothing is written to the data file).");
            this.placePile();
        }
    }

    // The pile section normally sits under the multi section. When multi holds no entries
    // it is moved into the multi header cell so it shares that line.
    placePile() {
        if (!this.commandpileui || !this.commandpileui.comp || !this.commandpileui.comp.element) return;
        var pileelement = this.commandpileui.comp.element;
        var multiempty = this.commandmultiui.getDataMaxIndex() < 0;
        var inline = multiempty && this.commandmultiui.pilecell;
        var target = inline ? this.commandmultiui.pilecell : this.comp;
        if (target && target.element && pileelement.parentNode !== target.element) target.element.appendChild(pileelement);
        // A fieldset is block-level, so it would wrap onto its own line. When sharing the
        // multi header line, make it inline-block and drop the top margin so the pile
        // controls line up with the multi ones instead of flowing onto a second line.
        this.commandpileui.comp.setStyle("display", inline ? "inline-block" : "");
        this.commandpileui.comp.setStyle("vertical-align", inline ? "top" : "");
        if (this.commandpileui.titlediv) this.commandpileui.titlediv.setStyle("margin-top", inline ? "0" : "15px");
    }

    createTagButtons(sortedTags, configstate) {
        if (!sortedTags && typeof appConfig !== 'undefined' && appConfig) {
            sortedTags = appConfig.tags;
        }
        this.tagrow = this.multilineui.addRow();
        var cell = this.tagrow.addCell();
        this.tagbuttonpanel = new CommandButtonPanel(cell, cell.id + "multlinebuttonpanel");
        var newrow = this.multilineui.addEmptyRow();
        if (typeof appConfig !== 'undefined' && appConfig) {
            let buttonnumber = appConfig.tags.length;
            if (buttonnumber > 0) {
                cell = newrow.addCell();
                this.tagbuttonscell = cell; // Store reference for refresh
                cell.setAttribute("colspan", buttonnumber);
                var tagsTitle = new SimpleText(cell, "tags_title", "transient");
                tagsTitle.setStyle("font-size", "70%");
                tagsTitle.setStyle("color", "gray");
                tagsTitle.setStyle("margin-right", "5px");

                this.tagscheckbox = new CheckBox(cell, "tagscheckbox");
                this.tagscheckbox.setStyles({"position": "relative", "top": "3px"});
                this.tagscheckbox.setStyle("margin-left", "5px");
                this.tagscheckbox.setStyle("margin-right", "15px");
                //        this.tagscheckbox.setStyle("margin-top","5px");
                this.tagscheckbox.setStyle("margin-bottom", "2px");
                this.tagscheckbox.setStyle("font-size", "65%");
                if (configstate && configstate["transient-tag"] == 1) this.tagscheckbox.setText(1);
                this.tagscheckbox.pchecked = this.tagscheckbox.element.checked;
                this.tagscheckbox.addListener("onchange", this.transientTagChanged.bind(this));

                for (let j = 0; j < buttonnumber; j++) {
                    let tag = sortedTags[j];
                    let tagbstyle = {
                        "font-size": "60%",
                        "margin": "2px",
                        "padding": "2px 2px",
                        "background-color": stringToColor(tag),
                        "border-radius": "8px"
                    };
                    this.tagbuttonpanel.addButton("tag_" + j, "#" + tag + " 🏷️",
                        tagbstyle,
                        this.saveWithTag.bind(this, tag),
                        cell
                    );

                    // Add a line break after every 5th tag (except the last one)
                    if ((j + 1) % 5 === 0 && j < buttonnumber - 1) {
                        let br = new ComponentNode(cell, "br_" + j);
                        br.tag = "br";
                        br.updateElement();
                    }
                }
            }

        }
    }

    refreshTagButtons(sortedTags) {
        if (!this.tagbuttonpanel || !this.tagbuttonpanel.buttons) return;

        // Remove existing tag buttons from the DOM
        for (var i = 0; i < this.tagbuttonpanel.buttons.length; i++) {
            var btn = this.tagbuttonpanel.buttons[i];
            if (btn.element && btn.element.parentNode) {
                btn.element.parentNode.removeChild(btn.element);
            }
        }
        this.tagbuttonpanel.buttons = [];

        // Remove existing br tags (but preserve checkbox and title)
        if (this.tagbuttonscell && this.tagbuttonscell.element) {
            var brElements = this.tagbuttonscell.element.querySelectorAll('br[id^="br_"]');
            for (var k = 0; k < brElements.length; k++) {
                if (brElements[k].parentNode) {
                    brElements[k].parentNode.removeChild(brElements[k]);
                }
            }
        }

        // Recreate buttons with new order
        if (typeof appConfig !== 'undefined' && appConfig && appConfig.tags.length > 0 && this.tagbuttonscell) {
            const buttonnumber = sortedTags.length;

            for (let j = 0; j < buttonnumber; j++) {
                let tag = sortedTags[j];
                let tagbstyle = {
                    "font-size": "60%",
                    "margin": "2px",
                    "padding": "2px 2px",
                    "background-color": stringToColor(tag),
                    "border-radius": "8px"
                };
                this.tagbuttonpanel.addButton("tag_" + j, "#" + tag + " 🏷️",
                    tagbstyle,
                    this.saveWithTag.bind(this, tag),
                    this.tagbuttonscell
                );

                // Add a line break after every 5th tag (except the last one)
                if ((j + 1) % 5 === 0 && j < buttonnumber - 1) {
                    let br = new ComponentNode(this.tagbuttonscell, "br_" + j);
                    br.tag = "br";
                    br.updateElement();
                }
            }
        }
    }

    // Ř=ÜG NEW: Sends the save request overriding ONLY the command value
    saveWithTag(tag) {
        if (DEBUG_PROBABILITY_MODEL) console.log("CommandUI::saveWithTag " + tag);
        var argtext = "";
        var args = this.commandlineui.getArgURL();
        var fullargs = this.commandlineui.getFullArgURL();
        if (args.indexOf("command=") >= 0) {
            //remove argument if found
            let start = args.indexOf("&command=");
            if (start < 0) start = args.indexOf("?command=");
//            if(start<0) start=args.indexOf("&command=");
            if (start >= 0) {
                let end = args.indexOf("&", start + 1);
                args = args.substring(0, start);
                if (end >= 0) args += args.substring(end, args.length);
            }
        }
        if (args.length > 0) args += "&"; else args += "?";
        args += "command=" + tag;
        let compids = this.commandlineui.getCompIds();
        let checked = this.tagscheckbox.element.checked;
        disenableload("/save" + args, compids, !checked);

        if (!checked) return;
        //    setTimeout(function(){
        disenableload("/set" + fullargs, compids);
        //     },100);

        /*
                // Loop over components identically to CommandLineUI.getArgURL()
                for (var k in this.commandlineui.row.valuecomps) {
                    var comp = this.commandlineui.row.valuecomps[k];
                    var dkey = comp.dkey;

                    // Override the "command" value specifically!
                    if (dkey === "command") {
                        if(argtext.length>0) argtext+="&"; else argtext+="?";
                        argtext += dkey + "=" + encodeURIComponent(tag);
                        continue;
                    }

                    // Get user input or standard text for other fields
                    var utext = comp.getUserInput();
                    if (utext !== undefined && utext != this.commandlineui.data[k]) {
                        if(argtext.length>0) argtext+="&"; else argtext+="?";
                        argtext += dkey + "=" + encodeURIComponent(utext);
                    }
                }

                // Lock both the standard UI components and the new tag buttons while saving
                var compIds = this.commandlineui.getCompIds();
                for (var i = 0; i < this.tagButtonPanel.buttons.length; i++) {
                    compIds.push(this.tagButtonPanel.buttons[i].id);
                }

                disenableload("/save" + argtext, compIds);*/
    }

    updateFile(datafile) {
        this.commandlineui.updateFile(datafile);
        this.commandmultiui.updateFile(datafile);
        if (this.commandpileui) {
            this.commandpileui.updateFile(datafile);
        }
        // Rebuild probability model from updated data.txt (with caching)
        if (DEBUG_PROBABILITY_MODEL) console.log("CommandUI::updateFile - calling buildModel");
        this.tagProbabilityModel.buildModel(datafile);
    }

    update(data) {
        this.commandlineui.update(data["data"]);
        this.commandmultiui.update(data["multi"]);
        if (this.commandpileui) {
            this.commandpileui.update(data["pile"], data["configstate"]);
        }
        this.placePile();

        // Update recent IDs select from idlist
        if (this.idSelect && data["configstate"] && data["configstate"]["idlist"]) {
            var idlist = data["configstate"]["idlist"];
            var ids = idlist ? idlist.split(",") : [];

            // Only update if the list has changed
            if (this.lastIdList !== idlist) {
                this.lastIdList = idlist;
                var selectOptions = ["Recent IDs"].concat(ids);
                this.idSelect.setOptions(selectOptions);
            }
        }

        // Update tag order based on current block history
        if (data["blockinfo"] && data["blockinfo"]["history"]) {
            var probs = this.tagProbabilityModel.predictNextTag(data["blockinfo"]["history"]);
            if (probs) {
                var sortedTags = appConfig.tags.slice().sort(function(a, b) {
                    // Sort by probability descending, but zero-probability tags go to the end
                    var probA = probs[a] || 0;
                    var probB = probs[b] || 0;
                    if (probA === 0 && probB === 0) return 0;
                    if (probA === 0) return 1; // a goes to end
                    if (probB === 0) return -1; // b goes to end
                    return probB - probA; // higher probability first
                });
                if (DEBUG_PROBABILITY_MODEL) {
                    console.log("=== Final Tag Order ===");
                    console.log("Sorted tags with probabilities:");
                    for (var i = 0; i < sortedTags.length; i++) {
                        console.log("  " + (i+1) + ". " + sortedTags[i] + " (probability: " + (probs[sortedTags[i]] || 0).toFixed(3) + ")");
                    }
                }
                this.refreshTagButtons(sortedTags);
            }
        }

        var upc = 0;
        if (data["configstate"]["save-on-set"] == 1) upc = 1;
        this.saveonsetcheckbox.updateText(upc);
        this.saveonsetcheckbox.pchecked = upc;
        upc = 0;
        if (data["configstate"]["transient-tag"] == 1) upc = 1;
        this.tagscheckbox.updateText(upc);
        this.tagscheckbox.pchecked = upc;
        upc = 0;
        if (data["configstate"]["disable-generate"] == 1) upc = 1;
        this.disablegeneratecheckbox.updateText(upc);
        this.disablegeneratecheckbox.pchecked = upc;
        upc = 0;
        if (data["configstate"]["disable-rfid-id-save"] == 1) upc = 1;
        this.disablerfididsavecheckbox.updateText(upc);
        this.disablerfididsavecheckbox.pchecked = upc;
        upc = 0;
        if (data["configstate"]["multi"] == 1) upc = 1;
        this.multicheckbox.updateText(upc);
        this.multicheckbox.pchecked = upc;
    }

    onIdSelectChange() {
        var selectedId = this.idSelect.element.value;
        if (!selectedId || selectedId === "Recent IDs") return;

        var idField = this.commandlineui.row.valuecomps["id"];
        if (idField) {
            idField.element.value = selectedId;
            idField.updateFromUser();
            // Return the select to its placeholder after selection.
           // this.idSelect.element.selectedIndex = 0;
        }
    }

    restore() {
        console.log("CommandUI::restore");
        disenableload("/clearAll", [this.restorebutton.id]);
        var commandui = this;
        setTimeout(function () {
            disenableload("/set?command=harvest", [commandui.restorebutton.id]);
        }, 50);
    }

    generateid() {
        if (this.disablegeneratecheckbox && this.disablegeneratecheckbox.element.checked) return;
        var args = this.commandlineui.getArgURL();
        let comp = this.commandlineui.row.valuecomps["id"];
        console.log("CommandUI::generateID :" + "/generateID" + args);

        disenableload("/generateID" + args, [this.generateidbutton.id], 1,
            function () {
                let newid = this.response;
                let currentelement = document.activeElement;
                document.activeElement.blur();
                if (newid.length < 30) {
                    comp.setText(newid);
                    comp.updateText(newid);
                    currentelement.focus();
                }
            }
            , function () {
                console.log("CommandUI::generateID Error getting the new id");
            });
        ;
    }

    cleareverything() {
        console.log("CommandUI::cleareverything");
        disenableload("/clearAll", [this.clearallbutton.id]);
    }

    saveonset() {
        console.log("CommandUI::saveonset");
        if (this.saveonsetcheckbox.pchecked == this.saveonsetcheckbox.element.checked) return;
        if (this.saveonsetcheckbox.pchecked2 === this.saveonsetcheckbox.element.checked) return;
        this.saveonsetcheckbox.pchecked2 = this.saveonsetcheckbox.element.checked;
        var v = 0;
        if (this.saveonsetcheckbox.element.checked) v = 1;
        disenableload("/set?save-on-set=" + v, [this.saveonsetcheckbox.id]);
    }

    disablegenerate() {
        if (this.disablegeneratecheckbox.pchecked == this.disablegeneratecheckbox.element.checked) return;
        if (this.disablegeneratecheckbox.pchecked2 === this.disablegeneratecheckbox.element.checked) return;
        this.disablegeneratecheckbox.pchecked2 = this.disablegeneratecheckbox.element.checked;
        console.log("CommandUI::disablegenerate");
        var v = 0;
        if (this.disablegeneratecheckbox.element.checked) v = 1;
        disenableload("/set?disable-generate=" + v, [this.disablegeneratecheckbox.id]);
    }

    disablerfididsave() {
        if (this.disablerfididsavecheckbox.pchecked == this.disablerfididsavecheckbox.element.checked) return;
        if (this.disablerfididsavecheckbox.pchecked2 === this.disablerfididsavecheckbox.element.checked) return;
        this.disablerfididsavecheckbox.pchecked2 = this.disablerfididsavecheckbox.element.checked;
        console.log("CommandUI::disablerfididsave");
        var v = 0;
        if (this.disablerfididsavecheckbox.element.checked) v = 1;
        disenableload("/set?disable-rfid-id-save=" + v, [this.disablerfididsavecheckbox.id]);
    }

    multiChanged() {
        console.log("CommandUI::multicChanged");
        if (this.multicheckbox.pchecked == this.multicheckbox.element.checked) return;
        if (this.multicheckbox.pchecked2 === this.multicheckbox.element.checked) return;
        this.multicheckbox.pchecked2 = this.multicheckbox.element.checked;
        var v = 0;
        if (this.multicheckbox.element.checked) v = 1;
        disenableload("/set?multi=" + v, [this.multicheckbox.id]);
    }

    transientTagChanged() {
        if (this.tagscheckbox.pchecked == this.tagscheckbox.element.checked) return;
        if (this.tagscheckbox.pchecked2 === this.tagscheckbox.element.checked) return;
        this.tagscheckbox.pchecked2 = this.tagscheckbox.element.checked;
        console.log("CommandUI::transientTagChanged");
        var v = 0;
        if (this.tagscheckbox.element.checked) v = 1;
        disenableload("/set?transient-tag=" + v, [this.tagscheckbox.id]);
    }


    set() {
        console.log("CommandUI::set");

        // Check if command is blockdate and validate date/argument fields
        var commandField = this.commandlineui.row.valuecomps["command"];
        var currentCommand = commandField.getUserInput() || commandField.text;
        var commandContainsDate = currentCommand && currentCommand.toLowerCase().includes("date");

        if (commandContainsDate) {
            var dateField = this.commandlineui.row.valuecomps["date"];
            var argumentField = this.commandlineui.row.valuecomps["argument"];

            // Check if date field is invalid (has red background)
            if (dateField && dateField.activebgcolor === "#ffe6e6") {
                alert("Cannot set: date field is invalid !");
                console.log("Cannot set: date field is invalid");
                return;
            }

            // Check if argument field is invalid (has red background)
            if (argumentField && argumentField.activebgcolor === "#ffe6e6") {
                alert("Cannot set: argument field is invalid !");
                console.log("Cannot set: argument field is invalid");
                return;
            }
        }

        var args = this.commandlineui.getArgURL();
        if (args) disenableload("/set" + args, this.commandlineui.getCompIds());
    }

    bypass() {
        console.log("CommandUI::set");
        var args = this.commandlineui.getArgURL();
        if (args) disenableload("/setBypass" + args, this.commandlineui.getCompIds());
    }

    clear() {
        console.log("CommandUI::clear");
        disenableload("/clear", this.commandlineui.getCompIds());
    }

    undo() {
        console.log("CommandUI::undo");
        disenableload("/undo", this.commandlineui.getCompIds());
    }

    save() {
        console.log("CommandUI::save");
        var args = this.commandlineui.getArgURL();
        disenableload("/save" + args, this.commandlineui.getCompIds());
    }

};


/**
 * Function 1: Parses a string, checks if it's a valid date,
 * and returns a JavaScript Date object. Returns null if invalid.
 */
function parseToDate(input) {
    if (typeof input !== 'string') return null;

    const trimmedInput = input.trim();

    // Regex to match D/M/Y, DD.MM.YY, DD-MM-YYYY, etc.
    // Group 1: Day (1 or 2 digits)
    // Group 2: Month (1 or 2 digits)
    // Group 3: Year (2 or 4 digits)
    // Separators allowed: / . or -
    const dmyRegex = /^(\d{1,2})[./\-](\d{1,2})[./\-](\d{2}|\d{4})$/;

    // Secondary Regex for standard ISO formats like YYYY-MM-DD
    const ymdRegex = /^(\d{4})[./\-](\d{1,2})[./\-](\d{1,2})$/;

    let day, month, year;

    const dmyMatch = trimmedInput.match(dmyRegex);
    const ymdMatch = trimmedInput.match(ymdRegex);

    // Default to Day/Month/Year to resolve ambiguity
    if (dmyMatch) {
        day = parseInt(dmyMatch[1], 10);
        month = parseInt(dmyMatch[2], 10);
        year = parseInt(dmyMatch[3], 10);
    } else if (ymdMatch) {
        year = parseInt(ymdMatch[1], 10);
        month = parseInt(ymdMatch[2], 10);
        day = parseInt(ymdMatch[3], 10);
    } else {
        return null; // Does not match recognized date patterns
    }

    // Handle 2-digit years. (e.g., 23 becomes 2023, 85 becomes 1985)
    if (year < 100) {
        // Pivot year logic: years > 50 are assumed 1900s, <= 50 are 2000s
        year += year > 50 ? 1900 : 2000;
    }

    // Create the Date object (Note: month is 0-indexed in JS)
    const dateObj = new Date(year, month - 1, day);

    // Validate the date (Prevents JS from silently converting 31/02/2023 to March 3rd)
    if (
        dateObj.getFullYear() === year &&
        dateObj.getMonth() === month - 1 &&
        dateObj.getDate() === day
    ) {
        return dateObj;
    }

    return null; // Invalid date (e.g., 31/11/2023)
}

/**
 * Function 2: Takes a JS Date object and formats it to d/m/yy
 */
function formatDateToDMYY(dateObj) {
    if (!(dateObj instanceof Date) || isNaN(dateObj)) return null;

    const day = dateObj.getDate(); // Returns 1-31 (no leading zero)
    const month = dateObj.getMonth() + 1; // Returns 1-12 (no leading zero)

    // Get full year, convert to string, and slice the last 2 digits
    const shortYear = dateObj.getFullYear().toString().slice(-2);

    return `${day}/${month}/${shortYear}`;
}

/**
 * Helper Function: Combines both to take a string and output the target format
 */
function standardizeDateString(inputString) {
    const validDate = parseToDate(inputString);

    if (validDate) {
        return formatDateToDMYY(validDate);
    }

    return "Invalid Date";
}

/**
 * Strict D/M/YY format validator - accepts D/M/YY or DD/MM/YY format
 */
function isStrictDMYY(input) {
    if (typeof input !== 'string') return false;
    const trimmedInput = input.trim();
    // Match D/M/YY or DD/MM/YY format (1-2 digits, slash, 1-2 digits, slash, 2 digits)
    const strictRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/;
    const match = trimmedInput.match(strictRegex);

    if (!match) return false;

    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);

    // Handle 2-digit years
    const fullYear = year + (year > 50 ? 1900 : 2000);

    // Validate the date
    const dateObj = new Date(fullYear, month - 1, day);

    return (
        dateObj.getFullYear() === fullYear &&
        dateObj.getMonth() === month - 1 &&
        dateObj.getDate() === day
    );
}

/**
 * Format date to D/M/YY format (no leading zeros)
 */
function formatToDMYY(dateObj) {
    if (!(dateObj instanceof Date) || isNaN(dateObj)) return null;

    const day = dateObj.getDate(); // Returns 1-31 (no leading zero)
    const month = dateObj.getMonth() + 1; // Returns 1-12 (no leading zero)

    // Get full year, convert to string, and slice the last 2 digits
    const shortYear = dateObj.getFullYear().toString().slice(-2);

    return `${day}/${month}/${shortYear}`;
}
