var express = require('express');
var router = express.Router();
var ytdl = require('youtube-dl');
var request = require('request');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Youtube Downloader Web App' });
});

// convert to human readable format
function bytesToSize(bytes) {
   var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
   if (bytes == 0) return '0 Byte';
   var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
   return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
};


router.post('/video', function(req, res, next) {
    var url = req.body.url,
        formats = [],
        pattern = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/;

    request.get(url, function (err, resp, body) {
        // check if it is valid url
        if(pattern.test(resp.request.uri.href)) {
            ytdl.getInfo(url, ['--youtube-skip-dash-manifest'], function(err, info) {
                if(err) return res.render('listvideo', {error: 'The link you provided either not a valid url or it is not acceptable'});
				//console.log(info);
                // push all video formats for download (skipping audio)
                info.formats.forEach(function(item) {
                    if(item.format_note !== 'DASH audio' && item.filesize) {
                        item.filesize = item.filesize ? bytesToSize(item.filesize): 'unknown';
                        formats.push(item);
                    }
                });
                res.render('listvideo', {meta: {id: info.id, formats: formats}});
            })
        }
        else {
            res.render('listvideo', {error: 'The link you provided either not a valid url or it is not acceptable'});
        }
    });
})

router.get('/downloadvideo', (req,res) => {
	var format_id = req.query.format_id;
	var url = "https://www.youtube.com/watch?v="+req.query.video_id;
	const video = ytdl(url,
	  // Optional arguments passed to youtube-dl.
	  [`--format=${format_id}`],
	  // Additional options can be given for calling `child_process.execFile()`.
	  { cwd: __dirname })
	 
	// Will be called when the download starts.
	video.on('info', function(info) {
	  console.log('Download started')
	  console.log('filename: ' + info._filename)
	  console.log('size: ' + info.size)
	  res.set({
        'Content-Length':  info.size,
        'Content-Disposition': 'attachment; filename=' + `"video.mp4"`
      });
	})
	
	video.pipe(res);
});

module.exports = router;
