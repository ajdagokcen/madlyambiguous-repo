# Madly Ambiguous

### Synopsis

Madly Ambiguous is a demonstration and game for teaching the basics of structural (and other forms of linguistic) ambiguity.

The spunky Mr. Computer Head narrates as users read about structural ambiguity; after that, users face off against Mr. Computer Head in a game where they try to complete an ambiguous PP-attachment sentence in a way that makes Mr. Computer Head guess the incorrect interpretation. After playing a round of the game, users may read more about how Mr. Computer Head and systems like him are trained to deal with tasks of ambiguity.

Ultimately, users learn not only about structural ambiguity, but also a little bit about NLP tasks and their difficulty.

Any future updates to Madly Ambiguous can be tracked at the [GitHub repository](https://github.com/ajdagokcen/madlyambiguous-repo).

### Installation and Running

Madly Ambiguous is run through Node.js, which can be downloaded for installation [here](https://nodejs.org/en/download/) or via command line as outlined [here](https://nodejs.org/en/download/package-manager/).

Once Node.js is installed on the machine on which you want to run Madly Ambiguous, you can simply execute the bash script `RUN` in the project's root directory. By default, this will run MadlyAmbiguous at the local port numbered *1035*, although you can specify a different port number by instead running `app.js {port # of choice}`. The tool can then be accessed at **localhost:{PORT #}** within any browser, or at **{URL OF CHOICE}:{PORT #}** if you are running it on a properly set-up server.

You can run `CHECK` (again, within the project's root directory) to ensure that everything is in fact running, or `KILL` to end the process.

### Administration

***Managing the results file.*** The results of each round of Madly Ambiguous are stored in a flat file in `data/results.tsv`.  This file can be deleted at any time to start collecting data anew.  It has the following 3-column structure:

1. **INPUT-PHRASE** *(string; the input from the user meant to complete the sentence)*
2. **COMPUTER-GUESS** *(string; the representation of the computer's guess as to the proper sentence interpretation given the input)*
3. **USER-JUDGMENT** *(string; the representation of the user's judgment as to the proper sentence interpretation given the input)*

### Credits

Madly Ambiguous, Copyright 2016

Madly Ambiguous was created through the combined efforts of Ajda Gokcen, Ethan Hill, and Michael White, and funded through NSF Grant 1319318.

Any opinions, findings, and conclusions or recommendations expressed in this material are those of the author(s) and do not necessarily reflect the views of the National Science Foundation.

### License

Madly Ambiguous is licensed under GPL 3.0, shown in the file LICENSE.txt.

