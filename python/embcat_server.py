import argparse
import rpyc
from rpyc.utils.server import ThreadedServer
import csv
import gensim
from gensim.models import Word2Vec
import numpy as np
from numpy import linalg
from sklearn.cluster import SpectralClustering
from nltk.tokenize import TreebankWordTokenizer
from nltk.corpus import stopwords
from nltk.probability import FreqDist
from math import log

parser = argparse.ArgumentParser(description='server for using embeddings to classify phrases as utensil, food, manner or company')
parser.add_argument('-p', '--port', type=int, default=18861, help='port the server is running on (default 18861)')
parser.add_argument('-v', '--verbose', action='store_true', help='log setup and output steps in more detail')
parser.add_argument('-s', '--small', action='store_true', help='use small-sized embeddings file')
parser.add_argument('-t', '--train', help='file to use for training phrases')
parser.add_argument('-o', '--test', help='file to use for test phrases')
parser.add_argument('-u', '--unique', action='store_true', help='only score unique test phrases')
parser.add_argument('-c', '--n_clusters', type=int, default=3, help='number of embedding clusters per category (default 3)')
parser.add_argument('-S', '--no_server', action='store_true', help='skip running the server (just report train/test results)')
parser.add_argument('-z', '--visualize', action='store_true', help='save cluster visualization files')
parser.add_argument('-f', '--viz_file', default='madclust', help='prefix of visualization files')

args = parser.parse_args()

w2v_dir = '../data/'
data_dir = '../data/'
embeddings_fn = w2v_dir + ('gn.w2v.gensim.100k' if args.small else 'gn.w2v.gensim')
train_fn = (data_dir + 'train.tsv') if args.train is None else args.train
test_fn = (data_dir + 'test.tsv') if args.test is None else args.test

# use PTB tokenizer to avoid need for resources
tokenizer = TreebankWordTokenizer()
stop_words = set(stopwords.words('english'))
stop_words.add("'s")

def cossim(v1,v2):
    return np.dot(v1,v2) / (linalg.norm(v1) * linalg.norm(v2))

def cossim_norm(v1,v2): # assumes vectors already normed
    return np.dot(v1,v2) 

def norm_vec(v):
    return np.divide(v, linalg.norm(v))

def avg(vecs):
    if len(vecs) == 1: return vecs[0]
    retval = vecs[0]
    for vec in vecs[1:]:
        retval = np.add(retval, vec)
    retval = np.divide(retval, len(vecs))
    return retval

def weighted_avg(vecs, weights):
    weighted_vecs = [np.multiply(vec,weight) for (vec,weight) in zip(vecs,weights)]
    return avg(weighted_vecs)

print    
print 'loading word2vec embeddings from', embeddings_fn
model = Word2Vec.load(embeddings_fn)

# could normalize embeddings across the board, but
# that might require loading everything into memory
#print 'normalizing embeddings'
#model.init_sims(replace=True)

# setup truecase dict, mapping lowercase keys to distinct case
# keys that are more frequent
print 'setting up truecase dict'
casedict = {}
for i in range(len(model.vocab)):
    word = model.index2word[i]
    if not casedict.has_key(word.lower()):
    	casedict[word.lower()] = word
truecasedict = dict((k,v) for (k,v) in casedict.items() if k != v)
del casedict

# only truecase when missing and not a stopword
def truecase(word):
    if model.vocab.has_key(word) or word in stop_words:
        return word
    lower = word.lower()
    return truecasedict[lower] if truecasedict.has_key(lower) else word

# returns the stored count or 0
# nb: the count may only be the vocab size - the index if actual counts not stored
# nb: some stop words mysteriously missing; assigning count of 'the' in this case
def count(word):
    if word in stop_words and not model.vocab.has_key(word):
        return model.vocab['the'].count
    else:
        return model.vocab[word].count if model.vocab.has_key(word) else 0

# returns whether fused word01 is more frequent than either word0 or word1
def more_frequent(word01, word0, word1):
    return count(word01) > count(word0) or count(word01) > count(word0)

# split words, fusing adjacent tokens when more frequent
def split_words(phrase, only_known=True):
    words = [truecase(word) for word in tokenizer.tokenize(phrase)]
    retval = []
    idx = 0
    while idx < len(words):
        word0 = words[idx]
        fused = None
        if idx+1 < len(words):
            word1 = words[idx+1]
            word01 = truecase(word0 + '_' + word1)
            if more_frequent(word01, word0, word1):
                fused = word01
            else:
                word01 = truecase(word0 + '-' + word1)                
                if more_frequent(word01, word0, word1):
                    fused = word01
        if fused is not None:
            retval.append(fused)
            idx += 2
        else:
            if model.vocab.has_key(word0) or not only_known:
                retval.append(word0)
            idx += 1
    return retval

def inv_rank(word):
    return 1.0 / model.vocab[word].index

# info weighting:
# prob word ~= (1/index[word]) * k / n, by Zipf's Law
# sum prob word = k/n * sum_j (1/index[word_j])
# rel prob word = (1/index[word]) / sum_j(1/index[word_j])
# info word = - log rel prob word
# weight word = info word / sum_j info word_j
def avg_vec(words):
    vecs = [model[word] for word in words]
    if len(words) == 1: return avg(vecs)
    sum_inv_rank = sum(inv_rank(word) for word in words)
    rel_probs = [inv_rank(word) / sum_inv_rank for word in words]
    infos = [-1 * log(rel_prob, 2) for rel_prob in rel_probs]
    sum_infos = sum(infos)
    weights = [info / sum_infos for info in infos]
    return weighted_avg(vecs, weights)

def avg_vec_phr(phrase):
    words = split_words(phrase)
    if len(words) == 0: return None
    return avg_vec(words)

print 'reading training data from:', train_fn

cat_names = ['utensil', 'food', 'manner', 'company']
utensil_vecs, food_vecs, manner_vecs, company_vecs = [], [], [], []
cat_vecs = [utensil_vecs, food_vecs, manner_vecs, company_vecs]

with open(train_fn) as tsvfile:
    linereader = csv.reader(tsvfile, delimiter='\t')
    for row in linereader:
        phrase = row[0]
        cat = row[2]
        if cat == 'none': continue
        vec = avg_vec_phr(phrase)
        if vec is None: continue
        if cat == 'utensil': utensil_vecs.append((vec,phrase))
        elif cat == 'food': food_vecs.append((vec,phrase))
        elif cat == 'manner': manner_vecs.append((vec,phrase))
        else: company_vecs.append((vec,phrase))

print 'read', len(utensil_vecs), len(food_vecs), len(manner_vecs), len(company_vecs),
print 'examples of utensil, food, manner and company phrases'

# initialize cluster info
cluster_vecs, cluster_exemplars, cluster_outliers, cluster_labels = [], [], [], []

print 'clustering training items'

for (vecs,cat) in zip(cat_vecs,cat_names):
    if args.verbose:
        print 'clustering', cat, 'items'
    X = np.array([vec for (vec,_) in vecs])
    # nb: spectral clustering supports using cosine similarity, unlike using kmeans directly
    sc = SpectralClustering(n_clusters=args.n_clusters,affinity='cosine').fit(X)
    clusters = dict((k,[]) for k in set(sc.labels_))
    clustered = zip(vecs,sc.labels_)
    for ((vec,phrase),label) in clustered:
        clusters[label].append((vec,phrase))
    for label in clusters.keys():
        items = clusters[label]
        if args.verbose:
            print 'cluster', label
            print '; '.join([phrase for (_,phrase) in items])
        centroid = norm_vec(avg([vec for (vec,_) in items]))
        simvals = [(cossim_norm(norm_vec(vec),centroid),phrase) for (vec,phrase) in items]
        exemplar = max(simvals)[1]
        outlier = min(simvals)[1]
        if args.verbose:
            print 'exemplar:', exemplar
            print 'outlier:', outlier
        cluster_vecs.append(centroid)
        cluster_exemplars.append(exemplar)
        cluster_outliers.append(outlier)
        cluster_labels.append(cat)

print 'finished training with', len(cluster_vecs), 'clusters'
    

def choose_best(vec):
    simvals = [cossim_norm(norm_vec(vec), cvec) for cvec in cluster_vecs]
    return max(zip(simvals,range(len(simvals))))[1]

def choose_cat(vec):
    if vec is None: return 'company'
    best_idx = choose_best(vec)
    return cluster_labels[best_idx]


print
print 'trying test phrases in:', test_fn
if args.verbose: print

total, correct, wn_total, wn_correct, no_emb = 0, 0, 0, 0, 0
fdist = FreqDist()
seen = set()

with open(test_fn) as tsvfile:
    linereader = csv.reader(tsvfile, delimiter='\t')
    for row in linereader:
        phrase = row[0]
        cat = row[2]
        phr_cat = phrase + cat
        if args.unique and phr_cat in seen:
            continue
        else:
            seen.add(phr_cat)
        fdist[cat] += 1
        total += 1
        if len(row) == 3 or row[3] != '1':
            wn_total += 1
            if cat == row[1]: wn_correct += 1
        vec = avg_vec_phr(phrase)
        if vec is None:
            if args.verbose: print 'no embedding for:', phrase
            no_emb += 1
        pred_cat = choose_cat(vec)
        if cat == pred_cat:
            correct += 1
        elif args.verbose:
            print 'mistook:', phrase, 'as:', pred_cat, 'instead of:', cat
            if vec is not None:
                print 'with best match to cluster for:', cluster_exemplars[choose_best(vec)]

if args.verbose: print
print 'accuracy:', (1.0 * correct / total)
print 'out of:', total
if args.unique: print 'unique cases'
print 'with:', no_emb, 'no embedding cases'
print 'vs. WordNet accuracy:', (1.0 * wn_correct / wn_total)
print 'most frequent category: ', fdist.max()
print 'majority baseline: ', (1.0 * fdist[fdist.max()] / total)

if args.visualize:
    prefix = args.viz_file
    viz_emb_fn = prefix + '_X.txt'
    viz_lab_fn = prefix + '_labels.txt'
    viz_phr_fn = prefix + '_phrases.txt'
    print
    print 'saving embeddings to', prefix + '_*.txt'
    with open(viz_emb_fn,'wb') as tsvfile:
        linewriter = csv.writer(tsvfile, delimiter='\t')
        train_embs = [vec for vecs in cat_vecs for (vec,_) in vecs]
        for vec in train_embs:
            linewriter.writerow(vec)
        for vec in cluster_vecs:
            linewriter.writerow(vec)
    with open(viz_lab_fn,'wb') as tsvfile:
        linewriter = csv.writer(tsvfile, delimiter='\t')
        train_labs = [cat for (vecs,cat) in zip(cat_vecs,cat_names) for (_,_) in vecs]
        for lab in train_labs:
            linewriter.writerow([cat_names.index(lab)])
        for lab in cluster_labels:
            linewriter.writerow([cat_names.index(lab)])
    with open(viz_phr_fn,'w') as tsvfile:
        linewriter = csv.writer(tsvfile, delimiter='\t')
        train_phrs = [phrase.strip() for vecs in cat_vecs for (_,phrase) in vecs]
        #keepers = set(cluster_exemplars + cluster_outliers)
        for phr in train_phrs:
            if phr in cluster_outliers:
                linewriter.writerow([phr])
            else:
                linewriter.writerow([])
        for (lab,phr) in zip(cluster_labels,cluster_exemplars):
            linewriter.writerow([lab.upper() + ' (' + phr.strip() + ')'])
        
    
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
if not args.no_server:
    print 'starting server on port', args.port
    print
    t = ThreadedServer(MyService, port = args.port)
    t.start()


