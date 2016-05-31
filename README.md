# emacs-edit-chrome

> No more pain of editing text in your browser - use Emacs!

This Chrome extension lets you grab text from Chrome and send it to Eamcs for editing.

### Highlights

Edit text in `<textarea>` and `<input>` elements: [Demo1](http://www.echoecho.com/htmlforms08.htm), [Demo2](https://robertnyman.com/html5/forms/input-types.html)

as well as multiple browser-based editors:

* [CodeMirror](https://codemirror.net/) - including the ancient version used by [Google Apps Script](https://script.google.com/intro).
* [Ace](https://ace.c9.io)
* [TinyMCE](https://www.tinymce.com/)
* [contenteditable](http://html5demos.com/contenteditable) editors like:
[GMail](https://mail.google.com/mail/?view=cm&fs=1&tf=1) and jbt's [markdown-editor](https://jbt.github.io/markdown-editor).
* React-based editors such as the Wix website editor.

### How to use

1. Install this Chrome extension.
1. Setup your `.emacs` (see suggestion below).
1. Click on a textarea and right-click or press `Control-Shift-E` to invoke 'Emacs Edit'.
1. Emacs should popup ... edit your text then press `C-x-#` to exit emacs.
1. You should see your text inserted back into the textarea.


#### .emacs setup
I highly reccommend you use [use-package](https://github.com/jwiegley/use-package) to organize your .emacs and invoke [edit-server](https://melpa.org/#/edit-server).
```emacs
(use-package edit-server
  :if window-system
  :ensure t
  :defer t
  :init
  (add-hook 'after-init-hook 'server-start t)
  (add-hook 'after-init-hook 'edit-server-start t))
```

### Security

Installing a chrome extension can be a big security risk. With that in mind we:
* Use the minimum possible permissions. See [manifest.json](manifest.json). _TODO(wdm) Can we use CORS to avoid needing any permissions?_
* Do not run a content script on every webpage, just on the pages where you invoke it.
* Kepp the code-base small and auditable: [background.js](background.js) and [injected.js](injected.js) total less than 300 lines.


### Prior work

Inspired by the awesome [Edit with Emacs](https://github.com/stsquad/emacs_chrome) but written from scratch with:
* No fancy options, no UI is added to the current page.
* Tiny code base.
* Bubbles the `input` event which is required to support React components.
* No problems with dynamically added textareas.

### Known bugs

None. Let me know what you run into!
