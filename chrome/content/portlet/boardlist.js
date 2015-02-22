$(function($) {

var plugins = window.parent.jaane.plugins;
plugins.loadBoardList(document.location.hash.slice(1), function(data) {
  var $tree = $('<tree flex="1" hidecolumnpicker="true" seltype="single"><treecols><treecol primary="true" label="板一覧" flex="1"/><treecol label="uri" hidden="true"/></treecols></tree>');
  var $treechildren = $('<treechildren/>');
  for(var i = 0; i < data.length; ++i) {
    var v = data[i];
    var $treeitem = $('<treeitem container="true" open="false"/>');
    $treeitem.append($('<treerow/>').append($('<treecell>').attr('label', v[0])));
    var $children = $('<treechildren/>');
    for(var j = 1; j < v.length; ++j) {
      $children.append(
        $('<treeitem/>')
          .append($('<treerow/>')
            .append($('<treecell/>').attr('label', v[j][0]))
            .append($('<treecell/>').attr('label', v[j][1]))
          )
        );
    }
    $treeitem.append($children);
    $treechildren.append($treeitem);
  }
  $tree.append($treechildren);
  $(':root').append($tree);
  $tree.on('select', function(e) {
    var uri = this.view.getCellText(this.currentIndex, this.columns.getColumnAt(1));
    if(uri) {
      plugins.openBoard(uri, this.view.getCellText(this.currentIndex, this.columns.getColumnAt(0)));
    }
  });
});


});