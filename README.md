# databox-driver-google-takeout

Databox driver to support bulk import of google takeout data.

Currently supports Location History and Browsing History. Obviously this driver works best if you have an android phone and use google chrome.

Go to https://google.com/takeout (login)

Then select the data you wish to export (All Chrome data types, Location History JSON format) then click next 

Then Select create archive 

Once you archive has been created you can download and extract it. 

Then go to the driver configuration page and upload the following files:

Location History /Chrome/BrowserHistory.json 
Browsing History /Location History/LocationHistory.json