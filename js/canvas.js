answerLoaded = false;

function stop() { answerLoaded = true; }
function play() {

	/*************************
	********* BASICS *********
	**************************/

	var ctx, WIDTH, HEIGHT, MOUSEX, MOUSEY;

	function init() {
		canvas = $('#canvas');
		ctx = canvas[0].getContext("2d");
		ctx.canvas.width = canvas.parent().outerWidth(); //window.innerWidth;
		ctx.canvas.height = canvas.parent().outerHeight(); //window.innerHeight;

		WIDTH = canvas.width();
		HEIGHT = canvas.height();
		MOUSEX = -1;
		MOUSEY = -1;

		time = new Date().getTime();
		now = time;
		dt = now-time;
		elapsed = dt;

		opacity = 1;
		answerLoaded = false;

		emote = new Image();
		emote.src = '../images/photos/mrcomputerhead-thinking2.svg';

		return animate();
	}

	function animate() {
		//if (elapsed < 3000) {
		if (opacity > 0) {
			setTimeout(requestAnimationFrame(animate), ((dt>=1000/60) ? 0 : Math.floor(1000/60-dt)));
			draw();
		} else {
			ctx.drawImage(emote,0,0,0,0);
			clear();
			ctx.canvas.width = 0;
			ctx.canvas.height = 0;
			answerLoaded = false;
		}
	}

	function draw() {
		now = new Date().getTime();
		dt = now-time;
		dz = dt / (1000/60);
		time = now;
		elapsed += dt;

		clear();

		if (answerLoaded && elapsed >= 2000 && opacity > 0)
			opacity -= .04;
		var op = String(opacity);
		ctx.globalAlpha = opacity;

		rect('rgb(0,0,0)','',0,0,WIDTH,HEIGHT);

		if (WIDTH > 800) ctx.drawImage(emote,WIDTH/2-100,HEIGHT/2-300,200,200);
		else ctx.drawImage(emote,WIDTH/2-75,HEIGHT/2-200,150,150);

		var text = 'Let me think';
		var clr = 'rgba(255,255,255,1)';

		ctx.textBaseline = "top";
		if (WIDTH > 800) ctx.font = '100px ABeeZee';
		else ctx.font = '45px ABeeZee';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		colorText(clr,'',text,WIDTH/2,HEIGHT/2);
		
		ctx.textAlign = 'center';
		clr = 'rgba(255,255,255,0)';
		if (elapsed % 800 > 600) clr= 'rgba(255,255,255,1)';
			colorText(clr,'',' .',WIDTH/2+ctx.measureText(text+' . .').width/2,HEIGHT/2);
		if (elapsed % 800 > 400 && elapsed % 800 <= 600) clr = 'rgba(255,255,255,1)';
			colorText(clr,'',' .',WIDTH/2+ctx.measureText(text+' .').width/2,HEIGHT/2);
		if (elapsed % 800 > 200 && elapsed % 800 <= 400) clr = 'rgba(255,255,255,1)';
			colorText(clr,'',' .',WIDTH/2+ctx.measureText(text).width/2,HEIGHT/2);
	}

	function clear() { ctx.clearRect(0,0,WIDTH,HEIGHT); }

	init();

	/*************************
	***** DRAWING MACROS *****
	**************************/

	function setColors(fill,stroke) {
		if (fill && fill != '') ctx.fillStyle = fill;
		if (stroke && stroke != '') ctx.strokeStyle = stroke;
	}

	function colorShape(fill,stroke) {
		ctx.lineWidth = 2;
		setColors(fill,stroke);
		if (fill && fill != '') ctx.fill();
		if (stroke && stroke != '') ctx.stroke();
	}

	function colorText(fill,stroke,text,x,y) {
		setColors(fill,stroke);
		if (fill && fill != '') ctx.fillText(text,x,y);
		if (stroke && stroke != '') ctx.strokeText(text,x,y);
	}

	function gradient(colorpoints,x1,y1,x2,y2) {
		var grad = ctx.createLinearGradient(x1,y1,x2,y2);
		if (colors.length == 1) grad.addColorStop('0',colors[0]);
		else for (coor in colorpoints)
			grad.addColorStop(((x2-x1)/(parseInt(coor)-x1)).toString(),colorpoints[coor]);
		return grad;
	}

	function evenGradient(colors,x1,y1,x2,y2) {
		var grad = ctx.createLinearGradient(x1,y1,x2,y2);
		if (colors.length == 1) grad.addColorStop('0',colors[0]);
		else for (var i=0; i<colors.length; i++)
			grad.addColorStop(((1.0*i)/(1.0*colors.length-1.0)).toString(),colors[i]);
		return grad;
	}

	function circle(fill,stroke,x,y,r) {
		ctx.beginPath();
		ctx.arc(x, y, r, 0, Math.PI*2, true);
		ctx.closePath();
		colorShape(fill,stroke);
	}

	function rect(fill,stroke,x,y,w,h) {
		ctx.beginPath();
		ctx.rect(x,y,w,h);
		ctx.closePath();
		colorShape(fill,stroke);
	}

	function path(fill,border,points) {
		if (points.length > 0) {
			ctx.beginPath();
			ctx.moveTo(points[0][0],points[0][1]);
			for (var i=1; i<points.length; i++)
				ctx.lineTo(points[i][0],points[i][1]);
			ctx.closePath();
			colorShape(fill,border);
		}
	}

}
