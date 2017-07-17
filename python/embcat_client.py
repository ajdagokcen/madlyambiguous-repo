import argparse
import sys
import rpyc

parser = argparse.ArgumentParser(description='client for connecting to embeddings-based categorization server')
parser.add_argument('phrase', help='phrase to ask the server to categorize')
parser.add_argument('-p', '--port', type=int, default=18861, help='port the server is running on')
parser.add_argument('-v', '--verbose', action='store_true', help='log steps to stderr (normally anything on stderr will signal an error)')
args = parser.parse_args()

if args.verbose: print >> sys.stderr, 'connecting to server'
c = rpyc.connect("localhost", args.port)

if args.verbose: print >> sys.stderr, 'categorizing phrase:', args.phrase
cat = c.root.categorize_phrase(args.phrase)

if args.verbose: print >> sys.stderr, 'category:', cat

print cat
