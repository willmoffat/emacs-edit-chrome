# emacs-edit-chrome

Chrome extension for editing any textarea in Emacs.

### How to use

* Install this Chrome extension.
* Setup your `.emacs` (see suggestion below).
* Click on a textarea and press `Control-Shift-E` to invoke 'Emacs Edit' (or right-click)
* Emacs should popup ... edit your text then press `C-x-#` to exit emacs.
* You should see your text inserted back into the textarea.

#### .emacs setup
Highly reccommend use-package TODO: link.
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

* Minimum possible permissions
* and small code-base. You can audit manifest.json and background.js
* TODO(wdm) Can we use CORS to avoid needing any permissions?
* Not running as a content script on every webpage, just on the page where you invoke it.

### Prior work

Inspired by the awesome [Edit with Emacs](https://chrome.google.com/webstore/detail/edit-with-emacs/ljobjlafonikaiipfkggjbhkghgicgoh)
TODO: github.

Differences:
* No fancy options, no UI is added to the current page.
* Tiny code base.
* Bubbles the `input` event which is required to support React components.
* No problems with dynamically added textareas.

### Known bugs

* Doesn't work with GMail compose.
* Broken on CodeMirror editor sites like https://jbt.github.io/markdown-editor/
