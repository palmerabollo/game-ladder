$(document).ready(function () {
    $('#switcherTheme').change(function() {
        var cssFile = $('#switcherTheme option:selected').attr("tag");
        $('[tag="pageStyle"]').attr( "href", cssFile );
    });
});