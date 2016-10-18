var NLP = require('../');
var path = require('path');

var config = {
	'nlpPath':path.join ( __dirname,'./../corenlp'), //the path of corenlp
	'version':'3.5.2', //what version of corenlp are you using
	'annotators': ['tokenize','ssplit','pos','parse','sentiment','depparse','quote'], //optional!
	'extra' : {
			'depparse.extradependencie': 'MAXIMAL'
		}
};

var coreNLP = new NLP.StanfordNLP(config);

var http = require('http');
var url = require('url');

var server = http.createServer(function (request, response) {
	var queryData = url.parse(request.url, true).query;
	//response.writeHead(200, {'Content-Type': 'text/plain'});
	response.writeHead(200, {'Content-Type': 'text/html'});

//	if (queryData.q) {
		var sentence = 'Is there pain in your knee?';
		response.write(sentence+'<br><br>');
		//coreNLP.process(queryData.q, function(err, result) {
		coreNLP.process(sentence, function(err, result) {
			if(err)
				throw err;
			else {
				//response.write(JSON.stringify(result));
				//response.write('<pre>'+JSON.stringify(result['document']['sentences']['sentence']['dependencies'][0]['dep'][5],null,4)+'</pre>');
				//var x = result['document']['sentences']['sentence']['dependencies'][0]['dep'][5];
				var x = result['document']['sentences']['sentence']['dependencies'][2]['dep'];
				response.write(result['document']['sentences']['sentence']['parse']+'<br><br>');
				//response.write(x['$']['type']+'('+x['governor']['_']+','+x['dependent']['_']+')');
				for (var i=0; i<x.length; i++)
					response.write(x[i]['$']['type']+'('+x[i]['governor']['_']+','+x[i]['dependent']['_']+')<br>');
				response.write('<pre>');
				response.write(JSON.stringify(result,null,4)+'<br><br>');
				response.write('</pre>');
			}
	});

//	} else {
		//response.end('<span style="color:blue;">Hello!</span>\n');
//	}
});

server.listen(8990);
