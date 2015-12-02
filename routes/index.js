var express = require('express');
var Parser = require('parse-listing');
var router = express.Router();
var exec = require('child_process').exec;
var humanize = require('humanize');

router.use(function(req, res, next) {
    // res.send("requesting: "+req.url);
    var path = req.url.substr(1);
    console.log("routing path:" + path);
    if (path == '') {
        // list devices attached
        exec("adb devices", function(error, stdout, stderr) {
            var devices = stdout.split('\n');
            if (devices.length < 2) {
                res.send("no device attached.")
            };
            devices.shift();
            var attached_devices = devices.length;
            devices = devices.map(function(device_line) {
                console.log(device_line);
                return device_line.split('\t').shift();
            }).filter(function(device) {
                return !!device;
            })
            res.render('index', {
                title: 'select device',
                device_list: devices,
            })
        })
    } else {
        var device_index = path.indexOf('/');
        var device;
        var android_path;
        if (device_index == -1) {
            device = path;
            android_path = '/';
        } else {
            device = path.substr(0, device_index);
            android_path = path.substr(device_index);
        }
        android_path = "\""+decodeURI(android_path).replace(' ', '\\ ')+"\"";
        var cmd = "adb -s " + device + " shell ls -l /" + android_path;
        console.log("executing "+cmd);
        exec(cmd, function(error, stdout, stderr) {
            Parser.parseEntries(stdout, function(err, entries) {
                console.log('got entries: ' + entries.length);
                entries.forEach(function (entry) {
                    if (entry.type == 1) {
                        entry.name += '/';
                    };
                    if (entry.size > 0) {
                        entry.size = humanize.filesize(entry.size);
                    };
                    entry.time = new Date(entry.time);
                })
                if (path.charAt(path.length - 1) == '/') {
                    path = path.substr(0, path.length - 1);
                }
                path = path.substr(0, path.lastIndexOf('/') + 1);
                res.render('dir_content', {
                    files: entries,
                    upper: '/' + path,
                    type_class: 'filetype_0'
                });
            });
        });
    }
});

module.exports = router;
