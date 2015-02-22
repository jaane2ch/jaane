$(function($) {

var plugins = window.parent.jaane.plugins;
var windowLoaded = false;
plugins.loadThread(document.location.hash.slice(1), function(data) {
  var lines = data.split('\n');
  var $wrapper = $('#wrapper');
  for(var i = 0; i < lines.length; ++i) {
    if(!lines[i]) break;
    var line = lines[i] = lines[i].split('<>');
    var $res = $('<div/>').addClass('res').attr('data-resno', i+1);
    var $number = $('<span class="number"/>').append($('<a/>').attr('id','res-'+(i+1)).text(""+(i+1))).append('<span>: </span>');
    var $name = $('<span/>').addClass('name').html('<b>'+line[0]+'</b>');
    var $mail= $('<span/>').addClass('mail').text('['+line[1]+']');
    var $date= $('<span/>').addClass('date').text(line[2]);
    var $body= $('<div/>').addClass('body').html(line[3]);
    $res.append($number).append($name).append($mail).append($date).append($body);
    $wrapper.append($res);
  }
  $('#head > .title, title').text(lines[0][4]);
});


});