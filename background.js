(function() {
  "use strict";

  var EMACS_EDIT_SERVICE = 'http://127.0.0.1:9292/edit';
  var extName = chrome.app.getDetails().name;
  var defaultTitle = extName;

  // Set up context menu at install time.
  chrome.runtime.onInstalled.addListener(function() {
    chrome.contextMenus.create(
        {id: extName, title: extName, contexts: ["all"]});
    chrome.commands.getAll(updateShortcut);
  });

  chrome.contextMenus.onClicked.addListener(function(_, tab) {
    onActivate(tab);
  });
  chrome.browserAction.onClicked.addListener(onActivate);

  function updateShortcut(cmds) {
    var shortcut = cmds && cmds[0] && cmds[0].shortcut;
    if (shortcut) {
      defaultTitle += ' - ' + shortcut;
      badge('', '');
    }
  }

  function badge(text, title) {
    chrome.browserAction.setBadgeText({text: text});
    chrome.browserAction.setTitle({title: title || defaultTitle});
  }

  function showOK(session) {
    badge('', '');
    return session;
  }
  function showErr(session) {
    badge('err', '' + session.err);
    return session;
  }

  var nextId = 0;

  function onActivate(tab) {
    badge('...', 'Edit in progress');
    Promise.resolve({
             attr: 'emacs_id',
             id: nextId++,
             err: null,
             tabId: tab.id,  // TODO(wdm) Use for separate badges?
             url: tab.url
           })
        .then(getText)
        .then(emacsEdit)
        .then(setText)
        .then(showOK)
        .catch(showErr);
  }

  // Doesn't resolve until emacs has sent response.
  function emacsEdit(session) {
    console.log('edit in emacs', session);
    var opts = {
      method: 'post',
      headers: {
        "Content-type": "text/plain",
        "x-url": session.url,
        "x-id": session.id  // TODO(wdm) What is this for?
      },
      body: session.text
    };
    return fetch(EMACS_EDIT_SERVICE, opts)
        .then(function(r) {
          if (r.status === 200) {
            return r.text().then(function(text) {
              session.text = text;
              return session;
            });
          } else {
            throw new Error(r.statusText);
          }
        });
  }

  function getText(session) { return execFn(session, remoteGetText); }

  function setText(session) { return execFn(session, remoteSetText); }

  // Convert fn to a string and execute it in the tab context.
  function execFn(session, fn) {
    var code = 'JSON.stringify((' + fn.toString() + ')(' +
               JSON.stringify(session) + '));';

    return new Promise(function(resolve, reject) {
      var cb = function(r) {
        if (chrome.runtime.lastError) {
          session.err = chrome.runtime.lastError.message;
        } else {
          session = JSON.parse(r[0]);  // Update from client.
        }
        if (session.err) {
          reject(session);
        } else {
          resolve(session);
        }
      };
      // console.warn('exec code ', code);
      chrome.tabs.executeScript({code: code}, cb);
    });
  }

  function remoteGetText(session) {
    var el = document.activeElement;
    if (el && 'value' in el) {
      el.setAttribute(session.attr, session.id);
      session.text = el.value;
    } else {
      session.text =
          window.getSelection().toString() || document.body.textContent;
    }
    return session;
  }

  // Update text (and dispatch event - required for React apps)
  function remoteSetText(session) {
    var sel = '[' + session.attr + '="' + session.id + '"]';
    var el = document.querySelector(sel);
    if (!el) {
      session.err = 'Not found ' + sel;
    } else {
      el.value = session.text;
      el.dispatchEvent(new Event('input', {bubbles: true}));
    }
    return session;
  }

})();
