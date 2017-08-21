# Madly Ambiguous

### Synopsis

Madly Ambiguous is a demonstration and game for teaching the basics of structural (and other forms of linguistic) ambiguity.

The spunky Mr. Computer Head narrates as users read about structural ambiguity; after that, users face off against Mr. Computer Head in a game where they try to complete an ambiguous PP-attachment sentence in a way that makes Mr. Computer Head guess the incorrect interpretation. After playing a round of the game, users may read more about how Mr. Computer Head and systems like him are trained to deal with tasks of ambiguity.

Ultimately, users learn not only about structural ambiguity, but also a little bit about NLP tasks and their difficulty.

Any future updates to Madly Ambiguous can be tracked at the [GitHub repository](https://github.com/ajdagokcen/madlyambiguous-repo).

### Installation and Running

Madly Ambiguous is run through Node.js, which can be downloaded for installation [here](https://nodejs.org/en/download/) or via command line as outlined [here](https://nodejs.org/en/download/package-manager/).

Additionally, to support *advanced mode* which uses word embeddings, the following software is required:

* Python 2.7
* [RPyC](https://rpyc.readthedocs.io/en/latest/)
* [scikit-learn](http://scikit-learn.org/stable/install.html) version 0.17.1 or later 
* [gensim](http://radimrehurek.com/gensim/install.html)
* [NLTK](http://www.nltk.org/install.html) version 3.2.4 or later 

The full pre-trained Google News [word2vec](https://code.google.com/archive/p/word2vec/) embeddings can be downloaded from the word2vec site.  Much easier though would be to simply download the smaller files in gensim format consisting just of the most frequent 100k entries from the [madlyambiguous](http://madlyambiguous.osu.edu) site:

* [gn.w2v.gensim.100k](http://madlyambiguous.osu.edu:1035/data/gn.w2v.gensim.100k)
* [gn.w2v.gensim.100k.syn0.npy](http://madlyambiguous.osu.edu:1035/data/gn.w2v.gensim.100k.syn0.npy)

Once downloaded, these files should be moved to the data directory.

Finally, it's necessary to download the NLTK `stopwords` data as shown:

```python
$ python
...
>>> import nltk
>>> nltk.download('stopwords')
```

Once Node.js is installed on the machine on which you want to run Madly Ambiguous, you can simply execute the bash script `RUN` in the project's root directory. By default, this will run MadlyAmbiguous at the local port numbered *1035*, although you can specify a different port number by instead running `app.js {port # of choice}`. The tool can then be accessed at **localhost:{PORT #}** within any browser, or at **{URL OF CHOICE}:{PORT #}** if you are running it on a properly set-up server.

You can run `CHECK` (again, within the project's root directory) to ensure that everything is in fact running, or `KILL` to end the process.

To support advanced mode, an additional python server must be run as well.  This server only needs to accept connections from the Node.js server, so there's no need for it to accept external connections.  It can be run by executing the `RUN_PYSERV` script in the project's root directory.  By default, it will run on port 18861.  If a different port is needed, it can be specified with the `-p` option in the `RUN_PYSERV` script, and by changing the default port in `python/embcat_client.py` accordingly.

Starting the python server can take a while since loading the word embeddings can be time-consuming.  Once the word embeddings are loaded, it quickly trains and tests its disambiguation model and then starts listening on the designated port.  The results can be seen in `python/nohup.out`.

To check whether the python server is still running, you can similarly run `CHECK_PYSERV` (again, within the project's root directory), or `KILL_PYSERV` to end the process.

### Administration

***Managing the results file.*** The results of each round of Madly Ambiguous are stored in a flat file in `data/results.tsv`.  This file can be deleted at any time to start collecting data anew.  It has the following 4-column structure:

1. **INPUT-PHRASE** *(string; the input from the user meant to complete the sentence)*
2. **COMPUTER-GUESS** *(string; the representation of the computer's guess as to the proper sentence interpretation given the input)*
3. **USER-JUDGMENT** *(string; the representation of the user's judgment as to the proper sentence interpretation given the input)*
4. **ADV-MODE** *(string; 0 if in basic mode, 1 if in advanced mode when determining the computer's guess)*

### Credits

Madly Ambiguous, Copyright 2016-2017

Madly Ambiguous was created through the combined efforts of Ajda Gokcen, Ethan Hill, and Michael White, along with David King, Matt Metzger, and Kaleb White, and was funded in part through NSF Grant 1319318.

Any opinions, findings, and conclusions or recommendations expressed in this material are those of the author(s) and do not necessarily reflect the views of the National Science Foundation.

### License

Madly Ambiguous is licensed under GPL 3.0, shown in the file LICENSE.txt.

