var socket = null;

// nix weird jquery.mobile.js loading message at bottom
$.mobile.loading().hide();

var click = 'click'; //'click mouseup touchend focus tap';

var localwin = ['Hah! I knew it!', 'That one was too easy.', 'Piece of cake.', 'Just as I thought.'];
var localloss = ['Oh, fine, you got me this time.', 'I\'ll get it next time, just you wait!', 'Dang, I thought I had that one!', 'Aw, no way!', 'What?! Are you sure?'];

var globalperf = ['You\'ll never beat me!', 'Keep trying!', 'Get more creative with your words if you want to stump me!', 'Challenge me a little, won\'t you?'];
var globalfail = ['Okay, I\'ll admit it. You\'re good.', 'Looks like I\'ve got some studying to do . . .', 'I think you\'re cheating!'];

var globalwinlocalwin = ['Not bad for a computer, huh?', 'I told you I was good at this.', 'I can do this all day.'];
var globalwinlocalloss = ['I\'m not doing too shabby overall.', 'I\'m still pretty good at this, no?', 'You just got lucky this time.'];
var globallosslocalwin = ['You\'re pretty good at this, though.', 'Keep it coming, I\'m on a roll!', 'I\'m just getting started.'];
var globallosslocalloss = ['You\'re pretty good at this, I guess.', 'I\'m just having an off day, is all.', 'Just let me warm up a little.'];

$(document).ready(function() {

	InitDocument();

	var cUrl = document.url;
	socket = io.connect(cUrl);

	socket.on('ReturnWN', function(data) {
		//console.log(data);
		var guess = 'Jane ate spaghetti in the presence of <span class="blank"></span>.';
		$('.opt .txt:first-child').text('No,');
		$('.opt').removeClass('compsel');
		$('.opt').removeClass('usersel');
		$('.opt.'+data).addClass('compsel');

		if (data == 'utensil') {
			guess = 'Jane used <span class="blank"></span> to eat spaghetti.';
			$('.responsive').slick('slickGoTo',0);
		} else if (data == 'food') {
			guess = 'Jane had spaghetti and <span class="blank"></span>.';
			$('.responsive').slick('slickGoTo',1);
		} else if (data == 'manner') {
			guess = 'Jane exhibited <span class="blank"></span> while eating spaghetti.';
			$('.responsive').slick('slickGoTo',2);
		} else $('.responsive').slick('slickGoTo',3);

		$('.opt.compsel .txt:first-child').text('Yes,');
		$('.guess').empty();
		$('.guess').append(guess);

		var inputtext = $('.input-widget').children('.input-box').text();
		$('.blank').text(inputtext);
		$('.blank.capital').text(inputtext.charAt(0).toUpperCase()+inputtext.slice(1));

		UserInput = inputtext;
		CompGuess = data;

		stop();
	});

	socket.on('ReturnSWN', function(data) {
		console.log(data);
	});

});

function InitDocument() {
	$('.slider').slick('slickGoTo',0);
	$('.slider').each(function(){ShowOrHideArrows($(this));});

	CorrectCount = 0;
	IncorrectCount = 0;

	UserInput = '';
	CompGuess = '';
	UserJudge = '';

}

function GetRandomElem(l) {
	var min = 0;
	var max = l.length-1;
	var ind = (Math.floor(Math.random() * (max - min + 1)) + min);
	return l[ind];
}

//TODO: get this working on iOS...
$(document).on(click,'.input-enter',function(event) {
	var inputtext = $(this).closest('.input-widget').children('.input-box').text();
	$('.blank').text(inputtext);
	$('.blank.capital').text(inputtext.charAt(0).toUpperCase()+inputtext.slice(1));
	if (inputtext.trim() != '') {
		socket.emit('RequestParse',[inputtext]);
		play(); //draw canvas
		$('.vertical').slick('slickGoTo',3);
	}
});

$(document).on(click,'.input-clear',function(event) {
	$(this).parent().children('.input-box').text('');
});

$(document).on('keydown','.input-box',function(event) {
	if (event.keyCode === 13) {
		event.preventDefault();
		$('.input-enter').click();
	}
});

$(document).on(click,'a',function(event) {
	if (!$(this).hasClass('carousel-control')) {
		event.preventDefault();
		var aid = $(this).attr('href').substring(1);
		var aTag = $("a[name='"+ aid +"']");
		$('html,body').animate({scrollTop: aTag.offset().top},'200ms');
	}
});

$(document).on('slid.bs.carousel', '.carousel#IntroCarousel, .carousel#OutroCarousel', function() {
	$(this).children('.carousel-control').fadeIn('fast');//.show();
		$('#'+$(this).attr('id')+' .right.carousel-control .glyphicon').first().removeClass('glyphicon-refresh');
		$('#'+$(this).attr('id')+' .right.carousel-control .glyphicon').first().addClass('glyphicon-chevron-right');
	if ($('#'+$(this).attr('id')+' .carousel-inner .item:first').hasClass('active')) {
		$(this).children('.left.carousel-control').fadeOut('fast');//.hide();
	} else if ($('#'+$(this).attr('id')+' .carousel-inner .item:last').hasClass('active')) {
		$(this).children('.right.carousel-control').fadeOut('fast');//.hide();
	}
});

$('.carousel').carousel({
	interval: false
});

$(document).on('swipeleft','.carousel',function(){
	if (!$('#'+$(this).attr('id')+' .carousel-inner .item:last').hasClass('active'))
		$(this).carousel('next');
});

$(document).on('swiperight','.carousel',function(){
	if (!$('#'+$(this).attr('id')+' .carousel-inner .item:first').hasClass('active'))
		$(this).carousel('prev');
});


$(document).on(click,'.opt',function(event) {
	if ($('.opt.usersel').length == 0) {
		$(this).addClass('usersel');

		var correct = false;
		if ($(this).hasClass('compsel')) {
			CorrectCount += 1;
			correct = true;
		} else IncorrectCount += 1;

		var global = 'loss';
		if (IncorrectCount == 0 && CorrectCount > 2) global = 'perf';
		else if (CorrectCount == 0 && IncorrectCount > 2) global = 'fail';
		else if (CorrectCount > IncorrectCount) global = 'win';

		var local = 'loss';
		if (correct) local = 'win';

		$('.stats').empty();
		var stats = '';
		stats += '<div class="img emote" style="background-image:url(\'../images/photos/mrcomputerhead-';
		if (global == 'perf') stats += 'grinning';
		else if (global == 'fail') stats += 'pensive';
		else if (global == 'win' && local == 'win') stats += 'grinning';
		else if (global == 'win' && local == 'loss') stats += 'pensive';
		else if (global == 'loss' && local == 'win') stats += 'grinning';
		else if (global == 'loss' && local == 'loss') stats += 'pensive';
		stats += '2.svg\');"></div>';
		stats += '<br><br>';

		if (local == 'win') stats += GetRandomElem(localwin);
		else stats += GetRandomElem(localloss);
		stats += '<br><br>';

		stats += 'I\'ve made <span class="emph">'+String(CorrectCount)+'</span>';
			stats += ' correct guess'+((CorrectCount==1)?'':'es')+' and ';
		stats += '<span class="emph">'+String(IncorrectCount)+'</span>';
			stats += ' incorrect guess'+((IncorrectCount==1)?'':'es')+'.';
		stats += '<br><br>';

		if (global == 'perf') stats += GetRandomElem(globalperf);
		else if (global == 'fail') stats += GetRandomElem(globalfail);
		else if (global == 'win' && local == 'win') stats += GetRandomElem(globalwinlocalwin);
		else if (global == 'win' && local == 'loss') stats += GetRandomElem(globalwinlocalloss);
		else if (global == 'loss' && local == 'win') stats += GetRandomElem(globallosslocalwin);
		else if (global == 'loss' && local == 'loss') stats += GetRandomElem(globallosslocalloss);

		$('.stats').append(stats);
		$('.vertical').slick('slickGoTo',4);

		UserJudge = $(this).attr('class').split(/\s+/)[1];
		socket.emit('SaveResults',[UserInput, CompGuess, UserJudge]);
	}
});

$('.vertical').slick({
	vertical: true,
	infinite: false,
	arrows: false,
	swipe: false,
	accessibility: false
});

$('.basic').slick({
	prevArrow: '<button type="button" data-role="none" class="slick-prev" aria-label="Previous" tabindex="0" role="button"><i class="fa fa-chevron-left"></i></button>',
	nextArrow: '<button type="button" data-role="none" class="slick-next" aria-label="Next" tabindex="0" role="button"><i class="fa fa-chevron-right"></i></button>',
	infinite: false,
	arrows: true
});

$('.responsive').slick({
	centerMode: true,
	prevArrow: '<button type="button" data-role="none" class="slick-prev" aria-label="Previous" tabindex="0" role="button"><i class="fa fa-chevron-left"></i></button>',
	nextArrow: '<button type="button" data-role="none" class="slick-next" aria-label="Next" tabindex="0" role="button"><i class="fa fa-chevron-right"></i></button>',
	infinite: false,
	arrows: true,
	slidesToShow: 3,
	slidesToScroll: 1,
	responsive: [
		{
			breakpoint: 1024,
			settings: {
				slidesToShow: 3
			}
		},
		{
			breakpoint: 768,
			settings: {
				slidesToShow: 1
			}
		}
	]
});

$('.slider').on('afterChange', function() {
	ShowOrHideArrows($(this));
	if ($(this).slick('slickCurrentSlide') == 2)
		$('.input-clear').trigger(click);
});

function ShowOrHideArrows(slider) {
	if (!slider.slick('getSlick').slickGetOption('infinite') && slider.slick('getSlick').slickGetOption('arrows')) {
		if (slider.slick('slickCurrentSlide') == 0) {
			slider.children('.slick-prev').hide();
			slider.children('.slick-next').show();
		} else if (slider.slick('slickCurrentSlide') == slider.slick('getSlick').slideCount-1) {
			slider.children('.slick-prev').show();
			slider.children('.slick-next').hide();
		} else {
			slider.children('.slick-prev').show();
			slider.children('.slick-next').show();
		}
	}
}

function ToggleFullScreen() {
	if (screenfull.enabled) screenfull.toggle(document.documentElement);
}

$(document).on('webkitfullscreenchange mozfullscreenchange fullscreenchange MSFullscreenChange', function() {
	if (screenfull.isFullscreen) {
		$('.fullscreen').children('i').removeClass('fi-arrows-out');
		$('.fullscreen').children('i').addClass('fi-arrows-in');
	} else {
		$('.fullscreen').children('i').removeClass('fi-arrows-in');
		$('.fullscreen').children('i').addClass('fi-arrows-out');
	}
});


