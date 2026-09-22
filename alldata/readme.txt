								Super Scale manual

How to use super scale ?
- Switch on the device and wait for it to be ready. 
- Put an object on the plateau to get the weight in gram. 
- Scan a QR code or use the UI to fill a command (e.g. harvest, species), an id, and eventually an argument (other than current weight). 
The connection will also provide a timestamp to the device reauired for saving.
Once it has a command, an id and a timestamp, the device will be able to save.
Use a browser to open the webpage superscale.local, or the "superscale" AP wifi network then http://192.168.4.1.

Significant fields:
- id
- species
- blockdate
- harvest

Useful URLs:
- /switchToAP?apssid=apssid&appassword=appassword
- /switchToStation?ssid=ssid&password=password
- /stats/edit.html?fileurl=../config.json
- /deleteDataFile

Button use
- "Save" by pressing the green left button. (pin 12)
- "Tare" by pressing the pink right button. (pin 33), long press reset the price sum
- add price to sum (pin 32 black button), price change (pin 35 embedded right button), switch screen (pin 0 embedded left button) 

Wifi config
- loaded from config.json : ssid/password & apssid/appassword
- if station is failed, connect AP (if no apssid defined, use default credential "SuperScale"/"")
- whenever mode, ssid or password is changed (e.g. through the web UI), config.json file is rewritten

Use cases
- superscale for harvest
- initial tagging at preparation : + substrate tagging + species-inoc.date 

Data interpretation
The program will save data lines only when it has an up to date time (for that open home page with browser), and a non void command. The data line(s) is saved on save press, in the web ui or the physical save button			
			
Some command have a special meaning are used for eg sums such as
    cancel, cancel tag, cancel all : cancel previous entry, previous such command entry, or all previous entries for that id
	anything containing "substrate"		
	"harvest" is used to calculate flushes 		
For other variables, only the last value counts, the previous are discarded			
the only significative command is "cancel", with no argument it cancel last line, with argument it cancel last such command, with "all" cancel everything previous for this id (to implement)			
stat filter syntax is the same with conditions in testgroup.json		


Files

config file		?			
data file:		data.txt			
headers file		headers.txt		headers used in data file	
		default format	date, id, command, argument (,arg2,arg3,...)		
price file		prices.json			
stat group file		stats/testgroups.json			
renaming and formulas		stats/config.js		allvarnames & defvarnames are variable names, all and default selection, tested in stat page and displayed in list	
					
	
					
testgroup.json syntax					
	the syntax is json + comments possible, objects are used to name lists with names				
	the content describe statistical tests and groups included in the tests Conditions define what data participate to both each test and each group. 				
			Because Anova so requires, each data point will be part of only one group for each test, the same data cannot be in 2 groups in the same test. 		
					A data point will be added to the first group of each test for which it satisfies the conditions.
	level 1 objects are : 				
		"lists" : a list of lists of values used in the conditions, e.g. substrates. The name of each list is the key and the content are the values			
		"groups" : contain a list of groups, each group is an object its name is the key and contains a "title", a "short" title and declared inline "conditions" list 			
		"tests": contain a list of tests 			
			each test is an object and it's name is the key, it contains, a "title", a "short" title, a list of "conditions" (declared inline) and a list of "groups"		
				each group can be a name referencing a group in "groups" list  	
		each condition is an object where the key is the type of condition and the content is the arguments of the condition			
			this prevent unfortunately from making multiple conditions in the same test		