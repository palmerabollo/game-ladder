var plug_theme_switcher = function() {
    $('#switcherTheme').change(function() {
      var cssFile = $('#switcherTheme option:selected').attr("tag");
      $('[tag="pageStyle"]').attr( "href", cssFile );
    });
};

String.prototype.shorten = function(max_length) {
    // TODO use max_length
    return this.replace(/^(.{15}[^\s]*).*/, "$1");
}