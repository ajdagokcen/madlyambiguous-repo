
import numpy as np
#import pylab as plt
from matplotlib import pyplot as plt
#from tsne import tsne
from sklearn.manifold import TSNE
from scipy.spatial.distance import pdist, squareform

print 'loading clusters from madclust_*.txt'
emb_matrix = np.loadtxt('madclust_X.txt')
emb_labels = np.loadtxt('madclust_labels.txt')
emb_phrases = [line.strip() for line in open('madclust_phrases.txt')]

print 'computing cosine similarities'
X = squareform(pdist(emb_matrix, metric='cosine'))
print 'running TSNE to reduce to two dimensions'
model = TSNE(metric='precomputed', perplexity=12, learning_rate=100, method='exact') # verbose=2
reduced_matrix = model.fit_transform(X)

print 'plotting figures'

# plot cluster centroids
fig = plt.figure(figsize=(12,9))

plt.scatter(reduced_matrix[:, 0], reduced_matrix[:, 1], 20, emb_labels)
plt.axis('off')

for (phrase,row) in zip(emb_phrases,reduced_matrix):
    if phrase[:4].isupper():
        x, y = row[0], row[1]
        plt.annotate(phrase, (x,y))

print 'saving to madclust.png'
fig.savefig('madclust.png', bbox_inches='tight', dpi=150)

# plot cluster centroids plus outliers at a larger size
fig2 = plt.figure(figsize=(16,12))

plt.scatter(reduced_matrix[:, 0], reduced_matrix[:, 1], 20, emb_labels)
plt.axis('off')

for (phrase,row) in zip(emb_phrases,reduced_matrix):
    if len(phrase) > 0 and phrase != '""':
        x, y = row[0], row[1]
        plt.annotate(phrase, (x,y))

print 'saving to madclust_outliers.png'
fig2.savefig('madclust_outliers.png', bbox_inches='tight', dpi=200)
