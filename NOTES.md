# Madly Ambiguous: Notes and Ongoing Issues

## TODO

### Minor Issues

* Hyperlinks not working properly

There are a couple of links in the explanation (to WordNet, word2vec and t-SNE), but they don't work when you click on them, unless you right-click and choose show-in-new-window, which doesn't appear to be available on an iPad.

* Arrow keys don't work to advance or go back through slides

This is naturally more important for desktop than tablet settings.

* Full-screen mode doesn't work on iPads

Full-screen mode for iOS safari is a bit weird but even so it appears that it should be possible to essentially achieve full-screen capability in a way that's not currently working.

One perhaps related piece of information is that the log from running node indicates that certain icon files don't exist (copied below).  This appears related to the various 'link' elements at the top of index.html.

log file message:
```
Does not exists: /madlyambiguous/madlyambiguous-repo/apple-touch-icon-152x152-precomposed.png
Does not exists: /madlyambiguous/madlyambiguous-repo/apple-touch-icon-152x152.png
Does not exists: /madlyambiguous/madlyambiguous-repo/apple-touch-icon.png
Does not exists: /madlyambiguous/madlyambiguous-repo/apple-touch-icon.png
```

### Wish List

* Dynamic explanations

It would be fantastic to add a button "Explain Choice" along with "Play Again" etc that explains the Mr Computer Head's last decision. For basic mode, this could list the WordNet synset and definition for the head noun; for advanced mode, this could be the phrase for the closest sub-cluster embedding to the user's phrase embedding.

* More ambiguity types

It would be great to also demonstrate a coordination ambiguity of the "old/bearded men and women" kind.


## The iOS Issue

**NB: This issue may have been resolved well enough by Matt Metzger's changes.**

There is a major issue with JavaScript/jQuery event binding when accessing Madly Ambiguous from an iOS operating system.  Desktop Mac OS does not seem to have the issue.

The issue seems not to be limited to "click" events, as was originally suspected, and in fact also applies to events such as "hover."

**Versions of iOS on which these problems apparently do not persist:**
- iOS 10 beta 6

**Versions of iOS on which these problems apparently do persist**
- (everything else)

**Failed attempts to fix the issue include:**
- adding `cursor: pointer;` to the CSS for the elements that need to be clicked
- adding an `onClick=""` attribute in the html declaration for the elements that need to be clicked
- using a "tap" event instead of / in addition to a "click" event
- various mobile event JavaScript/jQuery extensions: `fastclick.js`, `ios.js`, `jquery-mobile-events.js`

**Unexplored paths that could lead to fixing the issue:**
- Event bindings from 3rd party extensions such as Bootstrap might be working? Unclear; but if so, then perhaps the issue is something about the way `js/main.js` is written.
- The issue could be with dynamic elements and binding events to them, although the current event binding code is specifially written to circumvent that, and most elements do exist in the base HTML (index.html), so they shouldn't be considered dynamic.  There may be some interaction with the node.js backend that causes the elements to be handled oddly on iOS.

