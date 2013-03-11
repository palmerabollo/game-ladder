var plug_theme_switcher = function() {
	$('#switcherTheme').change(function() {
	  var cssFile = $('#switcherTheme option:selected').attr("tag");
	  $('[tag="pageStyle"]').attr( "href", cssFile );
	});
};

$('.comments input').keypress(function(event) {
	if (event.keyCode == 13) {
		$(this).parent().find('a.link.send').click();
	}
});
