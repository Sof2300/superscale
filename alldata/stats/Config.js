var config= {
	defvarnames: ["totalharvest", "totalBE", "firstflushharvest", "firstflushBE"],
	allvarnames: ["totalharvest", "totalBE", "firstflushharvest", "firstflushBE", "firstflushdays", "flushes"],
	equivalences: {
		spawn: {"1/4": 500, "1/5": 400, "1/6": 330},
		"substrate/PTb": "substrate/PTc"
	}
}
var SUBSTRATEKEYWORD = "substrate", HARVESTKEYWORD = "harvest", MAXFLUSHDAYS = 7, SECONDSPERDAY=60*60*24;
