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
