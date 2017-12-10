const cmd = require('node-cmd');
const fs = require('fs');

cmd.get(
        "echo $(fswebcam -d /dev/video0 -F 5 --no-banner - | base64)",
        function(err, data, stderr){
		fs.writeFile("./test.txt", data)
		console.log(data)
        } );


