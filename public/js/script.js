	
	var controls = document.querySelectorAll("#mainView > div:not(#playView)");
	var queue = document.getElementById("queue");
	var thumbs = document.getElementsByClassName("thumb");

	var playView = document.getElementById("playView"); 
	var vidCont = document.getElementsByClassName("vidContainer1");
	var video = document.getElementsByTagName("video")[0];
	
	var urlBtn = document.getElementById("urlBtn");
	var nameBtn = document.getElementById('nameBtn');
	var play = document.getElementById("play");
	var pause = document.getElementById("pause");
	var release = document.getElementById("release");
	var loop = document.getElementById("loop");

	var cropRect = document.querySelector("#resizable");
	var resizableW=document.querySelector("#rPanel>div").offsetWidth+"px";
	var resizableH=document.querySelector("#rPanel>div").offsetHeight+"px";


	play.onclick=function(){
		video.play();
		video.autoplay = true;
		socket.emit("bcPlayOut",video.autoplay);
	}

	pause.onclick=function(){
		video.pause();
		video.autoplay = false;
		socket.emit("bcPauseOut",video.autoplay);
	}
	release.onclick=function(){
		video.sampleStart = 0;
		video.sampleEnd = video.duration;
		socket.emit("bcReleaseOut",video.sampleStart,video.sampleEnd);
	}

	function adjVidSize(video){
		video.style.height = playView.offsetHeight + "px";
		video.style.width = playView.offsetWidth + "px";
		video.style.position = "fixed";
		video.style.left =playView.getBoundingClientRect().left + "px";
		video.style.top =playView.getBoundingClientRect().top + "px";
		console.log("vidAdj");
	}

	function adjQueue(){
		queue.style.height = controls[1].offsetTop+controls[1].offsetHeight/2+'px';
		nameBtn.style.marginTop = play.offsetTop + 'px';
	}

	//~!~ setting ctrls size to vid dimensions
	function adjustCtrls(){
		controls.forEach(function(item){
		item.style.width=playView.offsetWidth+"px";
		item.style.heigth=playView.offsetHeight+"px";
		})
	}

	function adjVolSldr(){
		vSldr.style.top = document.querySelector("span").offsetTop+"px";
		vSldr.style.height = controls[0].offsetHeight-document.querySelector("span").offsetTop+"px";
		vSldr.style.left = document.querySelector("#container").offsetLeft+"px";
		vSldr.style.width = seekbarSldr.offsetHeight + "px"; 	
	}

	function adjCropRect(){
		cropRect.parentElement.style.height = cropRect.parentElement.offsetWidth/1.777+"px";

	 	resizableH = cropRect.parentElement.offsetTop+cropRect.parentElement.offsetHeight-cropRect.offsetTop + "px";
	    cropRect.style.maxHeight = resizableH;
	    	
	    resizableW = cropRect.parentElement.offsetLeft+cropRect.parentElement.offsetWidth-cropRect.offsetLeft + "px";
	    cropRect.style.maxWidth = resizableW;
 	}

 	function cropDrag(){
		var distCropRectW = cropRect.getBoundingClientRect().left-cropRect.parentElement.getBoundingClientRect().left;
	    var distCropRectH = cropRect.getBoundingClientRect().top-cropRect.parentElement.getBoundingClientRect().top;

	    vidCont[0].style.left = distCropRectW*playView.offsetWidth/cropRect.parentElement.offsetWidth+"px";
	    vidCont[0].style.top = distCropRectH*playView.offsetHeight/cropRect.parentElement.offsetHeight+playView.offsetTop+"px";
	    socket.emit("bcCropDragOut",vidCont[0].style.left,vidCont[0].style.top);
	}

	function cropResize(){
		vidCont[0].style.width = cropRect.offsetWidth*playView.offsetWidth/cropRect.parentElement.offsetWidth+"px";
    	vidCont[0].style.height = cropRect.offsetHeight*playView.offsetHeight/cropRect.parentElement.offsetHeight+"px";
    	socket.emit("bcCropResizeOut",vidCont[0].style.width,vidCont[0].style.height);
	};

	adjustCtrls();
	adjVidSize(video);
	adjQueue();
	adjCropRect();

	window.addEventListener("resize", function(){
		adjustCtrls();
		adjQueue();
		adjVolSldr();
		adjCropRect();
		cropDrag();
		for (var i = 0; i < vidPlayers.length; i++) {
			adjVidSize(vidPlayers[i])
		}
		playrateZero.style.left = playrateSldr.offsetLeft + playrateSldr.offsetWidth/2 + "px";
		playrateZero.style.top = playrateSldr.offsetTop + "px";
	})
	// setting ctrls size to vid dimensions~!~

	// ~!~ sliders

	var opacitySldr = document.getElementById("opacity");

	opacitySldr.max = 100;
	opacitySldr.min = 0;
	opacitySldr.defaultValue = 100;
	opacitySldr.addEventListener("input", function(){
		video.style.opacity = opacitySldr.value/100;
		socket.emit("bcOpacityOut",video.style.opacity);
	})

	var playrateZero = document.getElementById("zeroPoint");
	var playrateSldr = document.getElementById("playback");

	playrateZero.style.height = playrateSldr.offsetHeight + "px";
	playrateZero.style.left =  playrateSldr.offsetLeft + playrateSldr.offsetWidth/2 + "px";
	playrateZero.style.top = playrateSldr.offsetTop + "px";

	playrateSldr.max=400;
	playrateSldr.min=-400;
	playrateSldr.defaultValue=100;
	playrateSldr.addEventListener("input", function(){
		video.playbackRate = playrateSldr.value/100;
		socket.emit("bcPlayRateOut", video.playbackRate);
	})	

	var seekbarSldr = document.getElementById("seekbar");

	video.addEventListener("durationchange", function(){
		seekbarSldr.max = video.duration*100;
	})

	seekbarSldr.min = 0;

	// possible stack overflow cause of "ontimeupdate" ??
	seekbarSldr.addEventListener("input", function(){
		video.currentTime = seekbarSldr.value/100;
		socket.emit("bcSeekbarOut",video.currentTime);
	})

	var vSldr = document.getElementById("volume");
	adjVolSldr();
	vSldr.max=100;
	vSldr.min=0;
	vSldr.defaultValue=100;

	vSldr.addEventListener("input", function(){
		video.volume = vSldr.value/100;
		socket.emit("bcVolumeOut",video.volume);
	})

	// sliders ~!~

// 	SAMPLING !!

// CONSTRUCTOR :?:?:

	function Sampler(slot){
		this.slot = slot;
		var self = this;
		this.slot.addEventListener("mousedown", function(event){
			if(event.shiftKey){
				self.overWrite = true;
				self.innerText = "";
				self.loopStart = video.currentTime;
				self.slot.innerText = Math.round(self.loopStart*10)/10;
			}else{
				video.currentTime = self.loopStart;
				video.sampleStart = self.loopStart;
				video.sampleEnd = self.loopEnd;
				socket.emit("bcSamplerOut", self.loopStart, self.loopEnd);
			}
		});
		this.slot.addEventListener("mouseup", function(event){
			if(self.overWrite === true){
			self.loopEnd = video.currentTime; 
			self.slot.innerText += " - " + Math.round(self.loopEnd*10)/10;
			self.overWrite = false;
			};
	});
	}
// :?:?: CONSTRUCTOR 

	var sampler1 = new Sampler(document.getElementById("slot1"));
	var sampler2 = new Sampler(document.getElementById("slot2"));
	var sampler3 = new Sampler(document.getElementById("slot3"));
	var sampler4 = new Sampler(document.getElementById("slot4"));

	// looping the playback range 
	video.addEventListener("timeupdate", function(){
		if(video.sampleEnd != undefined){
			if(video.currentTime > video.sampleEnd){
				video.currentTime = video.sampleStart;
			};
		};
		seekbarSldr.value =video.currentTime *100;
	});

// ~!~jQuery

 $( function() {
    $( "#resizable" ).resizable({
    	resize:function(){
    		cropResize()
    	},
    	create:function(){
    		cropResize()
    	}
    });
  });

 $( function() {
    $( "#resizable" ).draggable({
    	containment: "parent",
    	create: function(){
    		cropDrag();
    	},
    	drag: function(){
    	resizableH = cropRect.parentElement.offsetTop+cropRect.parentElement.offsetHeight-cropRect.offsetTop + "px";
    	cropRect.style.maxHeight = resizableH;    	
    	resizableW = cropRect.parentElement.offsetLeft+cropRect.parentElement.offsetWidth-cropRect.offsetLeft + "px";
    	cropRect.style.maxWidth = resizableW;

    	cropDrag();    	
    	}
    });
  });

// ~!~jQuery













// //  ~!~ sampler template
// 	var sample1 = document.getElementById("slot1");

// 	sample1.addEventListener("mousedown", function(event){
// 		if(event.shiftKey){
// 			sample1.overWrite = true;
// 			sample1.innerText = "";
// 			sample1.loopStart = video.currentTime;
// 			sample1.innerText = sample1.loopStart.toString();
// 		}else{
// 			video.currentTime = sample1.loopStart;
// 			video.sampleStart = sample1.loopStart;
// 			video.sampleEnd = sample1.loopEnd;
// 		}
// 	});
// 	sample1.addEventListener("mouseup", function(event){
// 			if(sample1.overWrite === true){
// 			sample1.loopEnd = video.currentTime; 
// 			sample1.innerText += " - " +  sample1.loopEnd.toString();
// 			sample1.overWrite = false;
// 			};
// 	});
// //  sampler template ~!~
