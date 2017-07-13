import sys
import rpyc

verbose = False
port = 18861

phrase = sys.argv[1]

if verbose: print >> sys.stderr, 'connecting to server'
c = rpyc.connect("localhost", port)

if verbose: print >> sys.stderr, 'categorizing phrase:', phrase
cat = c.root.categorize_phrase(phrase)

if verbose: print >> sys.stderr, 'category:', cat

print cat
