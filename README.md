# emacs-edit-chrome

Chrome extension for editing any textarea in Emacs.

### How to use

* Install this Chrome extension.
* Setup your `.emacs` (see suggestion below).
* Click on a textarea and press `Control-Shift-E` to invoke 'Emacs Edit' (or right-click)
* Emacs should popup ... edit your text then press `C-x-#` to exit emacs.
* You should see your text inserted back into the textarea.

#### .emacs setup
```
(use-package edit-server
  :if window-system
  :ensure t
  :defer t
  :init
  (add-hook 'after-init-hook 'server-start t)
  (add-hook 'after-init-hook 'edit-server-start t))
```

### Prior work

Inspired by the awesome [Edit with Emacs](https://chrome.google.com/webstore/detail/edit-with-emacs/ljobjlafonikaiipfkggjbhkghgicgoh).

* No fancy options, no UI additions current page, just minimal implementation.
* Bubbles 'input' event, so can update mounted React components.
* No problems with dynamically added textareas.

### Known bugs

* Doesn't work with GMail compose.
* Broken on https://jbt.github.io/markdown-editor/
