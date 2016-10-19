# Madly Ambiguous: Notes and Ongoing Issues

### The iOS Issue

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

