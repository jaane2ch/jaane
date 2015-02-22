$(function($) {
'use strict';

// とりあえずXPCOMのなんやらかんやら
// 製作者はXPCOMの何たるかを理解していないでござる
var Cc = Components.classes;
var Ci = Components.interfaces;
var Cu = Components.utils;
var FileUtils = Cu.import("resource://gre/modules/FileUtils.jsm").FileUtils;
var dirService = Cc['@mozilla.org/file/directory_service;1'].getService(Ci.nsIProperties);
var ifstream = Cc["@mozilla.org/network/file-input-stream;1"];
var icstream = Cc["@mozilla.org/intl/converter-input-stream;1"];
var sstream = Cc["@mozilla.org/scriptableinputstream;1"];
var ofstream = Cc["@mozilla.org/network/file-output-stream;1"];
var ocstream = Cc["@mozilla.org/intl/converter-output-stream;1"];

// ファイルを開く
function open(path, mode, dir) {
  if(dir) {
    var file = dirService.get(dir, Ci.nsIFile);
    var a = path.split('/');
    for(var i = 0; i < a.length; ++i ) {
      file.append(a[i]);
    }
  }
  else {
    var file = FileUtils.File(path);
  }
  if(mode ==='r') {
    if(!file.exists()) return;
    var f = ifstream.createInstance(Ci.nsIFileInputStream);
    f.init(file, -1, 0, 0);
    return f;
  }
  else if(mode==='w') {
    if(!file.exists()) {
        file.create(Ci.nsIFile.NORMAL_FILE_TYPE, 420);
    }
    var o = ofstream.createInstance(Ci.nsIFileOutputStream);
    o.init(file, 0x02 | 0x08 | 0x20, 420, 0);
    return o;
  }
}

// ファイルを開いて読んで閉じる
function getcontent(path, charset, dir) {
  var file = open(path, 'r', dir);
  if(!file) return;
  var conv = icstream.createInstance(Ci.nsIConverterInputStream);
  conv.init(file, charset, 1024, Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
  var data = "";
  var str = {};
  while (conv.readString(4096, str) !== 0) {
    data += str.value;
  }
  conv.close();
  file.close();
  return data;
}

// ファイルを開いて書いて閉じる
function writecontent(data, path, charset, dir) {
  var file = open(path, 'w', dir);
  if(!file) return false;
  var conv = ocstream.createInstance(Ci.nsIConverterOutputStream);
  conv.init(file, charset, 0, 0x0000);
  conv.writeString(data);
  conv.close();
  file.close();
  return true;
};

function addPortlet($target, $portlet) {
  switch($target.prop('tagName')) {
  case 'box':
    if($target.children().size()) $target.append('<splitter/>');
    $target.append($portlet);
    break;
  case 'tabbox':
    var $tab = $('<tab crop="end"/>');
    var title = $portlet.attr('title');
    if(title) $tab.attr('label', title);
    $target.children('tabs').append($tab);
    $target.children('tabpanels').append($('<tabpanel/>').append($portlet));
    $target.prop('selectedTab', $tab[0]);
    break;
  }
}

function defaultLoadBoardList(url, callback) {
    var loc = new URL(url);
    var data = getcontent('boardlist/' + loc.protocol.slice(0,-1) +'/' + loc.hostname+loc.pathname + '.json', 'utf-8', 'ProfD');
    if(data) {
      setTimeout(function() {
        callback(JSON.parse(data));
      },0);
      return;
    }
    defaultUpdateBoardList(url, callback);
};

function defaultUpdateBoardList(url, callback) {
    var loc = new URL(url);
    $.get(url, function(data) {
      var doc = (new DOMParser).parseFromString(data, 'text/html');
      var list = [];
      var $categories = $('b', doc);
      $categories.each(function() {
        var cat = [$(this).text()];
        var $elem =$(this).next();
        while($elem.size() && !$elem.is('b')) {
          if($elem.is('a')) {
            cat.push([$elem.text(), $elem.attr('href')]);
          }
          $elem = $elem.next();
        }
        list.push(cat);
      });
      callback(list);
      writecontent(JSON.stringify(list), 'boardlist/' + loc.protocol.slice(0,-1) +'/' + loc.hostname+loc.pathname + '.json', 'utf-8', 'ProfD');
    });
}


var re = /((.+)\.dat)<>(.*) \(([0-9]+)\)/;

function parseSubject(data, url) {
  var lines = data.split('\n');
  var list = [];
  for(var i = 0; i < lines.length; ++i) {
    var line = lines[i];
    if(line) {
      var res = re.exec(line);
      list.push([url+res[1], res[3], parseInt(res[4]), (new Date(parseInt(res[2])*1000)).toString()]);
    }
  }
  return list;
}

function defaultLoadBoard(url, callback) {
    var loc = new URL(url);
    var data = getcontent('board/' + loc.protocol.slice(0,-1) +'/' + loc.hostname+loc.pathname + 'subject.txt', 'utf-8', 'ProfD');
    if(data) {
      setTimeout(function() {
        callback(parseSubject(data, loc.protocol +'//' + loc.hostname + loc.pathname + 'dat/'));
      },0);
      return;
    }
    defaultUpdateBoard(url, callback);
};

function defaultUpdateBoard(url, callback) {
    var loc = new URL(url);
    $.ajax({
      url: url+'subject.txt',
      type:'get',
      headers: {
        'X-Requested-With': '',
        'Connection': 'close',
        'Accept-Encoding': 'gzip',
        'Accept': 'text/html, */*',
        'Accept-Language': ''
      },
      success: function(data) {
        callback(parseSubject(data, loc.protocol +'//' + loc.hostname + loc.pathname + 'dat/'));
        writecontent(data, 'board/' + loc.protocol.slice(0,-1) +'/' + loc.hostname+loc.pathname + 'subject.txt', 'utf-8', 'ProfD');
      }
    });
}

function defaultLoadThread(url, callback) {
    var loc = new URL(url);
    var data = getcontent('dat/' + loc.protocol.slice(0,-1) +'/' + loc.hostname+loc.pathname, 'utf-8', 'ProfD');
    if(data) {
        callback(data);
      return;
    }
    defaultUpdateThread(url, callback);
};

function defaultUpdateThread(url, callback) {
    var loc = new URL(url);
    $.ajax({
      url: url,
      type:'get',
      headers: {
        'X-Requested-With': '',
        'Connection': 'close',
        'Accept-Encoding': 'gzip',
        'Accept': 'text/html, */*',
        'Accept-Language': ''
      },
      success: function(data) {
        writecontent(data, 'dat/' + loc.protocol.slice(0,-1) +'/' + loc.hostname+loc.pathname, 'utf-8', 'ProfD');
        callback(data);
      }
    });
}



window.jaane = {
  plugins: {
    loadBoardList: function(url, callback) {
      defaultLoadBoardList(url, callback);
    },
    updateBoardList: function(url, callback) {
      defaultUpdateBoardList(url, callback);
    },
    openBoard: function(uri, title) {
      var src = 'chrome://jaane/content/portlet/board.xul#' + uri;
      if($('iframe[src="'+src+'"]').size()) return;
      var $board = $('.board');
      addPortlet($board, $('<iframe flex="1"/>').attr('src', 'chrome://jaane/content/portlet/board.xul#' + uri).attr('title', title));
    },
    loadBoard: function(url, callback) {
      defaultLoadBoard(url, callback);
    },
    openThread: function(uri, title) {
      var src = 'chrome://jaane/content/portlet/thread.html#' + uri;
      if($('iframe[src="'+src+'"]').size()) return;
      var $thread = $('.thread');
      addPortlet($thread, $('<iframe flex="1"/>').attr('src', 'chrome://jaane/content/portlet/thread.html#' + uri).attr('title', title));
    },
    loadThread: function(url, callback) {
      defaultLoadThread(url, callback);
    }
  }
};

// レイアウト設定ファイルを取得
var setting = getcontent('settings/portal.xml', 'utf-8', 'ProfD');
if(!setting) setting = getcontent('settings/portal.xml', 'utf-8', 'DefRt');

// XULはブラウザで使えるような物が大体揃ってるのでXMLのパースとかこういう時楽だよね
var doc = (new DOMParser).parseFromString(setting, 'application/xml');
var $portal = $("#portal");
var $portlets = $('portlet', doc);
var $layouts = $('layout', doc);
var $window = $(window);

$window.one('load', function(){
  //レイアウトを調整
  $layouts.each(function() {
    var position = this.getAttribute('position');
    var pos = position ? position.split('/') : [];
    for(var i = 0, $current = $portal; i < pos.length; ++i) {
      var cls = pos[i];
      var $tmp = $current.children('.layout-'+cls);
      if(!$tmp.size()) {
        $tmp = $('<box flex="1"/>').addClass('layout-'+cls);
        $current.append($tmp);
      }
      $current = $tmp;
    }
  });
  $layouts.each(function() {
    var position = this.getAttribute('position');
    var pos = position ? position.split('/') : [];
    for(var i = 0, $current = $portal; i < pos.length; ++i) {
      var cls = pos[i];
      $current = $current.children('.layout-'+pos[i]);
    }
    var type = this.getAttribute('type');
    switch(type) {
    case 'horizontal':
    case 'vertical':
      $current.attr('orient', type);
      for(var $elem = $current.children().eq(1); $elem.size(); $elem = $elem.next()) {
        $elem.before('<splitter/>');
      }
      break;
    case 'tabbox':
      var $children = $current.children();
      var $tabbox = $('<tabbox flex="1"/>').attr('class', $current.attr('class'));
      var $tabs = $('<tabs>');
      var $tabpanels = $('<tabpanels flex="1"/>');
      $tabbox.append($tabs).append($tabpanels);
      $current.before($tabbox);
      while($children.size()){
        $tabs.append('<tab/>');
        var $tabpanel =$('<tabpanel/>');
        $tabpanels.append($tabpanel);
        $tabpanel[0].appendChild($children[0]);
      }
      $current.remove();
      $current = $tabbox;
      break;
    }
    var width = this.getAttribute('width');
    if(width) {
      $current.css('width', width).removeAttr('flex');
    }
    var c = this.getAttribute('class');
    $current.addClass(c);
  });
  // ポートレットを配置
  $portlets.each(function() {
    var position = this.getAttribute('position');
    var pos = position ? position.split('/') : [];
    for(var i = 0, $current = $portal; i < pos.length; ++i) {
      var cls = pos[i];
      var $tmp = $current.children('.layout-'+cls);
      if(!$tmp.size()) {
        $tmp = $('<box flex="1"/>').addClass('layout-'+cls);
        $current.append($tmp);
      }
      $current = $tmp;
    }
    var $portlet = $('<iframe flex="1"/>').attr('src',this.getAttribute('ref'));
    var title = this.getAttribute('title');
    if(title) $portlet.attr('title', title);
    addPortlet($current, $portlet);
  });
  
  $('#url-bar').on('keypress', function(e) {
    switch(e.keyCode) {
    case 13:
      if(this.value.match(/^about:/)) {
        window.open(this.value, 'about', 'chrome,dialog=no,centerscree,resizable=yes,scrollbars=yes');
      }
      break;
    }
  });
});

});