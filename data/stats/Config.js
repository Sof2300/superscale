var config= {
	defvarnames: ["totalharvest", "totalBE", "firstflushharvest", "firstflushBE"],
	allvarnames: ["totalharvest", "totalBE", "firstflushharvest", "firstflushBE", "firstflushdays", "flushes"],
	equivalences: {
		spawn: {"1/4": 500, "1/5": 400, "1/6": 330},
		"substrate/PTb": "substrate/PTc"
	}
}
var doubleautocalc={
	formula:{
		list: ["substrate/strawpellet","substrate/bran","substrate/crownpellet","substrate/finetourikis","substrate/sawdust","substrate/finepeami"],
		map:{
			"Ppx5.5":{"substrate/strawpellet":1150,"substrate/bran":300},
			"aPpx5.5":{"substrate/strawpellet":1150,"substrate/alfalfa":300},
			Ppx6:{"substrate/strawpellet":1260,"substrate/bran":330},

			"Pcx5.5":{"substrate/crownpellet":1150,"substrate/bran":300},
			Pcx6:{"substrate/crownpellet":1260,"substrate/bran":330},

			"SDx5.5":{"substrate/sawdust":1150,"substrate/bran":300},
			SDx6:{"substrate/sawdust":1260,"substrate/bran":330},
			"Ftx5.5":{"substrate/finetourikis":1150,"substrate/bran":300},
			Ftx6:{"substrate/finetourikis":1260,"substrate/bran":330},
			"Fpx5.5":{"substrate/finepeami":1150,"substrate/bran":300},
			Fpx6:{"substrate/finepeami":1260,"substrate/bran":330}
		}
	}
}

var SUBSTRATEKEYWORD = "substrate", HARVESTKEYWORD = "harvest", MAXFLUSHDAYS = 7, SECONDSPERDAY=60*60*24;