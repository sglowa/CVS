var express = require("express")
var app = express();
var http = require('http').Server(app);
var io = require("socket.io")(http);
// WHICH ONE ??
var spawn = require("child_process").spawn;
var exec = require("child_process").exec;

// users array && user constructor
var users = [];
var userDir = __dirname +"/public/users/"

function User(id){
	this.id = id;
	this.name = null;
};

function Video(id,file,thumb){
	this.id = id;
	this.file = file;
	this.thumb = thumb;
};


// serving static files::
app.use(express.static(__dirname+"/public"));

app.get("/", function(req, res){
	res.sendFile(__dirname + "/public/index.html");
})

io.on("connection", function(socket){
	console.log("user connected!!");

	// ~~ looging users into an array
	var address = socket.id;
	console.log("new connection from " + address);
	var user = new User(address);
	users.push(user);
	// ~~

	// ~!~ updating users logged in 
	io.emit("usersLogged", users);
	socket.emit("hiLurker", users);
	// updating users logged in ~!~

	// ~!~ displaying the socket id
		// socket.emit("address", address)
	// displaying the socket id ~!~

	// ~!~ creating array for user's vids ~!~
	var userVids = [];

	socket.on("newUser", function(name){
		user.name = name;
		io.emit("usersLogged", users);
		socket.emit("hiUser", user);
		socket.broadcast.emit("userJoined", user);

		// ~!~ making user directory
		exec("mkdir " + userDir+name, function(err, stdout){
			if (err){
				console.log(err)
			}
			console.log(name+" folder created");
		})
		// making user directory ~!~
	})

	// downloading vid
	socket.on("newUrl", function(url){
		
			// ~!~checking if vid already downloaded!!
			var vidDouble = false;
			for (var i = 0; i < userVids.length; i++) {
				if(userVids[i].id == url.substring(url.indexOf("=")+1)){
					vidDouble = true;
				}
				console.log("userVidId: " + userVids[i].id);
			}
			console.log("currentVidId: "+ url.substring(url.indexOf("=")+1));
			// checking if vid already downloaded~!~

			if(!vidDouble){
				console.log("new vid");
				if(userVids.length > 3){
				// remove [0]vid from array and directory
				exec("rm "+userDir+user.name+"/"+userVids[0].id.trim()+".*", function(err,stdout){
					if(err){
						console.log(err)
					};
					console.log("stdout: "+stdout);
				});
				userVids.splice(0,1);
				}

				exec("youtube-dl -o "+userDir+user.name+"/"+"'%(id)s'"+".webm -f 43 --write-thumbnail "+url,function(err,stdout){
					if(err){
					console.log(err)
					}
				console.log("download completed!");
				// "find a better way to extract id"
				var vidId = stdout.substring(stdout.indexOf("]")+1, stdout.indexOf(":")).trim();
				var filePth ="./users/"+user.name+"/"+vidId+".webm";
				var thumbPth ="./users/"+user.name+"/"+vidId+".jpg";
				userVids.push(new Video(vidId,filePth,thumbPth));	
				socket.emit("newVid", userVids);
				});

			}else{
				console.log("vid already downloaded!");
				socket.emit("vidDouble");
			}					
	})



	socket.on("bcSrcOut", function(src){
		socket.broadcast.emit("bcSrcIn",src,user)
	})
	socket.on("bcPlayOut",function(autoplay){
		socket.broadcast.emit("bcPlayIn",autoplay,user)
	})
	socket.on("bcPauseOut",function(autoplay){
		socket.broadcast.emit("bcPauseIn",autoplay,user)
	})
	socket.on("bcReleaseOut",function(start,end){
		socket.broadcast.emit("bcReleaseIn",start,end,user)		
	})
	socket.on("bcOpacityOut", function(opac){
		socket.broadcast.emit("bcOpacityIn",opac,user)
	})
	socket.on("bcPlayRateOut", function(pr){
		socket.broadcast.emit("bcPlayRateIn",pr,user)	
	})
	socket.on("bcSeekbarOut", function(ct){
		socket.broadcast.emit("bcSeekbarIn",ct,user)		
	})
	socket.on("bcSamplerOut", function(start,end){
		socket.broadcast.emit("bcSamplerIn",start,end,user)
	})
	socket.on("bcVolumeOut",function(vol){
		socket.broadcast.emit("bcVolumeIn",vol,user)
	})
	socket.on("bcCropDragOut",function(x,y){
		socket.broadcast.emit("bcCropDragIn",x,y,user)
	})
	socket.on("bcCropResizeOut",function(x,y){
		socket.broadcast.emit("bcCropResizeIn",x,y,user)
	})

// !~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// socket.on("vidBroadcastOut", function(video){
	// 	socket.broadcast.emit("vidBroadcastIn",video);
	// })
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~!

	socket.on("disconnect", function(){
		console.log("user disconnected!");
		// delete usersVidPlayer at other Clients
		socket.broadcast.emit("userExit", user);
		if(user.name != null){
		exec("rm -r " +userDir+user.name);
		}
		// waay too complex, must be easier way
		users = users.filter(function(item){
					return item.id != socket.id
				});

		console.log("users in room : " + users.length);
		io.emit("usersLogged", users);
	})




	// passing the URL into Input box
	// socket.on("newUrl", function(data){
	// 	console.log("get " + data);
	// 	socket.broadcast.emit("passUrl", data);
	// })

})



http.listen(8080, function(err){
	if(err){
		console.log(err)
	}else{
		console.log("listening on port 8080");
	}
});

