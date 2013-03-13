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

var emoji_set_up = function() {
    emojify.setConfig({
        emojify_tag_type: 'div',
        emoticons_enabled: true,
        people_enabled: true,
        nature_enabled: true,
        objects_enabled: true,
        places_enabled: true,
        symbols_enabled: true
    });
}