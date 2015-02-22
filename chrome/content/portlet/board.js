$(function($) {

var plugins = window.parent.jaane.plugins;
plugins.loadBoard(document.location.hash.slice(1), function(data) {
  var $tree = $('<tree flex="1" seltype="single"/>').append(
        $('<treecols/>')
          .append('<treecol hidden="true"/>')
          .append('<treecol primary="true" label="番号"/>')
          .append('<treecol label="スレタイ" flex="1"/>')
          .append('<treecol label="レス"/>')
          .append('<treecol label="since"/>')
      );
  var $treechildren = $('<treechildren/>');
  for(var i = 0; i < data.length; ++i) {
    var v = data[i];
    $treechildren.append(
      $('<treeitem/>')
        .append($('<treerow/>')
          .append($('<treecell/>').attr('label', v[0]))
          .append($('<treecell/>').attr('label', ""+(i+1)))
          .append($('<treecell/>').attr('label', v[1]))
          .append($('<treecell/>').attr('label', v[2]))
          .append($('<treecell/>').attr('label', v[3]))
        )
      );
  }
  $tree.append($treechildren);
  $(':root').append($tree);
  $tree.on('select', function(e) {
    var uri = this.view.getCellText(this.currentIndex, this.columns.getColumnAt(0));
    if(uri) {
      plugins.openThread(uri, this.view.getCellText(this.currentIndex, this.columns.getColumnAt(2)));
    }
  });
});


});