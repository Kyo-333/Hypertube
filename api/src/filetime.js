
const fs = require('fs');

export default function FileDelete() {
    fs.readdir(__dirname + `/../Downloads`, (err, files) => {
        files.forEach(file => {
        //   console.log(file);
            fs.stat(__dirname + `/../Downloads/${file}`, function (err, stats) {
                // console.log(stats.atime);
                let timerFile = stats.atime;
                let fileH = timerFile.getHours();
                let fileM = timerFile.getMinutes();
                let fileMonth = timerFile.getMonth();
                let d = new Date();
                let m = d.getMinutes();
                let h = d.getHours();
                let monthNow = d.getMonth();
                console.log("ficheros:   " + fileH + ":" + fileM);
                console.log ("fecha now:  " + h + ":" + m);
                // if (h > fileH && m >= fileM) {
                // if (m > fileM) {
                if (monthNow > fileMonth) {
                    fs.unlink(__dirname + `/../Downloads/${file}`,function(err){
                        if(err) return console.log(err);
                        console.log('file deleted successfully');
                    });
                }
                if (err) {
                    return console.error(err);
                }
            });
        });
    });
}