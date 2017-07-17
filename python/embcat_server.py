import argparse
import rpyc
from rpyc.utils.server import ThreadedServer
import csv
import gensim
from gensim.models import Word2Vec
import numpy as np
from numpy import linalg

parser = argparse.ArgumentParser(description='server for using embeddings to classify phrases as utensil, food, manner or company')
parser.add_argument('-p', '--port', type=int, default=18861, help='port the server is running on')
parser.add_argument('-v', '--verbose', action='store_true', help='log steps to stderr (normally anything on stderr will signal an error)')
parser.add_argument('-s', '--small', action='store_true', help='use small-sized embeddings file')
parser.add_argument('-t', '--train', help='file to use for training phrases')
parser.add_argument('-o', '--test', help='file to use for test phrases')

args = parser.parse_args()

w2v_dir = '../data/'
data_dir = '../data/'
embeddings_fn = w2v_dir + ('gn.w2v.gensim.100k' if args.small else 'gensim.gn.w2v')
train_fn = (data_dir + 'train.tsv') if args.train is None else args.train
test_fn = (data_dir + 'test.tsv') if args.test is None else args.test
    
def cossim(v1,v2):
    return np.dot(v1,v2) / (linalg.norm(v1) * linalg.norm(v2))

def avg(vecs):
    if len(vecs) == 1: return vecs[0]
    retval = vecs[0]
    for vec in vecs[1:]:
        retval = np.add(retval, vec)
    retval = np.divide(retval, len(vecs))
    return retval
    
print 'loading word2vec embeddings from', embeddings_fn
model = Word2Vec.load(embeddings_fn)

def avg_vec(words):
    vecs = [model[word] for word in words]
    return avg(vecs)

# TODO: check for multiword phrases
def avg_vec_phr(phrase):
    words = [word for word in phrase.split() if model.vocab.has_key(word)]
    if len(words) == 0: return None
    return avg_vec(words)

print 'setting up category embeddings'

utensil_vec = model['fork']
food_vec = model['meatballs']
manner_vec = model['gusto']
company_vec = model['person']

cat_vecs0 = [utensil_vec, food_vec, manner_vec, company_vec] # (for comparison)
cat_names = ['utensil', 'food', 'manner', 'company']

print 'reading training data from:', train_fn

utensil_vecs = [utensil_vec]
food_vecs = [food_vec]
manner_vecs = [manner_vec]
company_vecs = [company_vec]

with open(train_fn) as tsvfile:
    linereader = csv.reader(tsvfile, delimiter='\t')
    for row in linereader:
        phrase = row[0]
        cat = row[2]
        if cat is 'none': continue
        vec = avg_vec_phr(phrase)
        if vec is None: continue
        if cat == 'utensil': utensil_vecs.append(vec)
        elif cat == 'food': food_vecs.append(vec)
        elif cat == 'manner': manner_vecs.append(vec)
        else: company_vecs.append(vec)

print 'read', len(utensil_vecs), len(food_vecs), len(manner_vecs), len(company_vecs),
print 'examples of utensil, food, manner and company phrases'

cat_vecs = [avg(utensil_vecs), avg(food_vecs), avg(manner_vecs), avg(company_vecs)]


def choose_cat(vec):
    if vec is None: return 'company'
    simvals = [cossim(vec, cvec) for cvec in cat_vecs]
    return max(zip(simvals, cat_names))[1]

print
print 'trying test phrases in:', test_fn
if args.verbose: print

total, correct, wn_correct, no_emb = 0, 0, 0, 0

with open(test_fn) as tsvfile:
    linereader = csv.reader(tsvfile, delimiter='\t')
    for row in linereader:
        phrase = row[0]
        cat = row[2]
        total += 1
        if cat == row[1]: wn_correct += 1
        vec = avg_vec_phr(phrase)
        if vec is None:
            if args.verbose: print 'no embedding for:', phrase
            no_emb += 1
        pred_cat = choose_cat(vec)
        if cat == pred_cat:
            correct += 1
        elif args.verbose:
            print 'mistook:', phrase
            print 'as:', pred_cat, 'instead of:', cat

if args.verbose: print
print 'accuracy:', (1.0 * correct / total)
print 'out of:', total
print 'with:', no_emb, 'no embedding cases'
print 'vs. WordNet accuracy:', (1.0 * wn_correct / total)

# define service
class MyService(rpyc.Service):
    def on_connect(self):
        # code that runs when a connection is created
        # (to init the serivce, if needed)
        if args.verbose: print 'received connection!'
        pass

    def on_disconnect(self):
        # code that runs when the connection has already closed
        # (to finalize the service, if needed)
        if args.verbose: print 'disconnected!'
        pass

    def exposed_categorize_phrase(self, phrase):
        # this is an exposed method
        if args.verbose: print 'received phrase:', phrase
        vec = avg_vec_phr(phrase)
        if vec is None:
            if args.verbose: print 'no embedding for:', phrase
        pred_cat = choose_cat(vec)
        if args.verbose: print 'categorized as: ', pred_cat
        return pred_cat

print
print 'starting server on port', args.port
t = ThreadedServer(MyService, port = args.port)
print
t.start()


