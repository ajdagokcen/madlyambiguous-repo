#!/usr/bin/env node

var http = require('http');
var util = require('util');

var url = require('url');
var path = require('path');

var app = http.createServer(processRequest);
var io = require('socket.io').listen(app);
var fs = require('fs');
var async = require('async');

var pos = require('pos');
var natural = require('natural');
var lemmer = require('lemmer');

/***** WORDNET *****/

var wn = require('./data/wn-entries.json')

/**********/

var clients = [];
var socketsOfClients = [];

// return a parameter value from the current URL
function getParam(data, sname) {
	var params = data.substr(data.indexOf("?") + 1);
	var sval = "";
	params = params.split("&");
	// split param and value into individual pieces
	for (i in params) {
		temp = params[i].split("=");
		if ([temp[0]] == sname) {
			sval = temp[1];
		}
	}
	return sval.replace(/\+/g, ' ');

}

function getJson(data) {
	var params = data.substr(data.indexOf("?") + 1);
	var sval = [];
	params = params.split("&");
	// split param and value into individual pieces
	for (i in params) {
		temp = params[i].split("=");
		var str = temp[0].text;
		sval.push({
			str: temp[1].value
		});
	}
	return sval;
}

var mimeTypes = {
	'html': 'text/html',
	'htm': 'text/html',
	'gif': 'image/gif',
	'jpg': 'image/jpeg',
	'jpeg': 'image/jpeg',
	'png': 'image/png',
	'svg': 'image/svg+xml',
	'js': 'text/javascript',
	'css': 'text/css',
	'mp3': "audio/mpeg",
	'ogg': "audio/ogg"
};

function processRequest(request, response) {
	"use strict";
	var uri, filename;
	uri = url.parse(request.url).pathname;
	filename = path.join(process.cwd(), uri);

	if (request.method === 'POST') {
		// the body of the POST is JSON payload.
		var data = '';
		request.addListener('data', function (chunk) {
			data += chunk;
		});
		request.addListener('end', function () {
			var bar = getParam(data, "name");
			console.log(bar);
			console.log("DATA:" + data);
			/*response.writeHead(200, {
				'content-type': 'text/json'
			});
			response.write(JSON.stringify({
				"id": 5
			}));
			response.end();*/
		});
	} /*else if (request.method === 'GET') {
		
	}*/

	// HOLE: Check for invalid characters in filename.
	// HOLE: Check that this accesses file in CWD's hierarchy.
	fs.exists(filename, function (exists) {
		var extension, mimeType, fileStream;
		if (exists) {
			if (fs.lstatSync(filename).isDirectory())
				filename += "index.html";

			extension = path.extname(filename).substr(1);
			mimeType = mimeTypes[extension] || 'application/octet-stream';
			response.writeHead(200, {
				'Content-Type': mimeType
			});

			// TODO: string as stream?
			fileStream = fs.createReadStream(filename);
			fileStream.pipe(response);

			// attempt to fix wrong urls killing the site
			fileStream.on('error', function (error) {console.log("Caught", error);});
			//fileStream.on('readable', function () {fileStream.read();});

		} else {
			console.log('Does not exists: ' + filename);
			response.writeHead(404, {
				'Content-Type': 'text/plain'
			});
			response.write('404 Not Found\n');
			response.end();
		}
	});
}

function GetMainN(words, taggedWords) {

	// transform each tag into first letter and turn into single string
	var s = '';
	taggedWords.forEach(function(x,i) { s += x[1][0]; });
	//console.log('1. '+s);

	var ind1 = 0;
	var ind2 = s.length;

	var x = Math.max(words.lastIndexOf('of'),words.lastIndexOf('with'));
	if (x >= 0) {
		ind1 += x+1;
		s = s.substring(x+1);
	}
	//console.log('2. '+s);

	var x = s.lastIndexOf('I');
	if (x >= 0) {
		ind2 = ind1 + x;
		s = s.substring(0,x);
	}
	//console.log('3. '+s);

	x = s.lastIndexOf('N');
	if (x >= 0) {
		ind2 = ind1 + x + 1;
		s = s.substring(0,x+1);
	}
	//console.log('4. '+s);

	var patt = s.match(/J*N+/);
	if (patt) {
		ind1 += s.indexOf(patt);
		ind2 = ind1+patt[0].length;
		s = s.substring(s.indexOf(patt),s.indexOf(patt)+patt[0].length);
	} /*else {
		ind1 = 0;
		ind2 = 0;
		s = '';
	}*/
	//console.log('5. '+s);
	//console.log('!! '+words.slice(ind1,ind2));

	return words.slice(ind1,ind2);
}

//////// Socket IO
io.on('connection', function (socket) {
	var address = socket.handshake.address;
	console.log("Connection from: " + address.address); // + ":" + address.port);

	socket.on('RequestParse', function(data) {
		var uname = socketsOfClients[socket.id];
		if (data.length > 0 && data[0] !== undefined && data[0] != '') {
            console.log("Advanced mode is " + data[1]);
			var words = new pos.Lexer().lex(data[0].toLowerCase());
			var tagger = new pos.Tagger();
			var taggedWords = tagger.tag(words);
			/*for (i in taggedWords) {
				var taggedWord = taggedWords[i];
				var word = taggedWord[0];
				var tag = taggedWord[1];
				console.log(word + " /" + tag);
			}*/
			// get first and last (exclusive) indices of main phrase
			// first group of Js and Ns
			// if phrase ends with IN or contains VBG, go for NONE OF THE ABOVE???
			var known = true;
			for (i in taggedWords)
				if (taggedWords[i][1] == 'VBG' || (i == taggedWords.length-1 && taggedWords[i][1] == 'IN'))
					known = false;

			if (known) {
				var mn = GetMainN(words, taggedWords);
				var ln = [];
				lemmer.lemmatize(mn, function(err,lems) {
					ln = lems;

					//mn.forEach(function(x,i) { ln.push(natural.PorterStemmer.stem(x)); });
					//mn.forEach(function(x,i) { ln.push(natural.LancasterStemmer.stem(x)); });

					// variants: 1. as-is + lem(as-is); 2. all but the last noun; 3. all indiv words, left to right
					var variants = [mn.join(' '), ln.join(' ')];
					if (mn.length > 1) variants = variants.concat([mn.slice(0,mn.length-1).join(' '), ln.slice(0,ln.length-1).join(' ')]);
					variants = variants.concat(mn).concat(ln);
					//console.log(variants)

					var found = false;
					for (var i=0; i<variants.length; i++) {
						if (wn.food.indexOf(variants[i]) >= 0) {
							socket.emit('ReturnWN','food');
							found = true;
						} else if (wn.utensil.indexOf(variants[i]) >= 0) {
							socket.emit('ReturnWN','utensil');
							found = true;
						} else if (wn.manner.indexOf(variants[i]) >= 0) {
							socket.emit('ReturnWN','manner');
							found = true;
						}
						if (found) break;
					}
					if (!found) socket.emit('ReturnWN','company');
				});

			} else socket.emit('ReturnWN','company');
			//} else socket.emit('ReturnWN','none');
		}
	});

	socket.on('SaveResults', function(data) {
		var uname = socketsOfClients[socket.id];
		fs.appendFile('data/results.tsv', data.join('\t')+'\n', "utf8", function (err) {
			if (err) console.log(err);
			else console.log("Saved results: " + data);
		});
	});


});

if (process.argv.length >= 3 && !isNaN(process.argv[2])) app.listen(process.argv[2]);
else app.listen(1035);
