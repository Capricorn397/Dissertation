'use strict'

const database = require('mysql')
const restify = require('restify')
const error = ''
const port = 8000
const firstArray = 0
const twoDP = 2
const fsTopTen = 10
const server = restify.createServer({
	name: 'Dissertation_Server',
	version: '0.0.5'
})
const io = require('socket.io')(server)
const httpCodes = {
	OK: 200,
	Created: 201,
	Unauthorized: 401,
	Forbidden: 403,
	notFound: 404,
	methodNotAllowed: 405,
	requestTimeout: 408,
	internalServerError: 500
}

const sql = database.createPool({
	user: 'mainServer',
	password: 'myDissertation',
	host: '217.182.64.177',
	port: 7999,
	database: 'dissertation',
	connectionLimit: 10
})

const questionStore = {}
const answerStoreWord = {}
const answerStoreYN = [0,0]
const answerStoreTF = [0,0]
const moduleTokens = ['340ct', '380ct', '370ct']

const serv = () => {
	server.listen(port, () => {
		console.log(`Server at ${server.url}`)
	})
}

module.exports.start = () => serv()
serv()
server.use(restify.queryParser())
server.use(restify.bodyParser())

//Echo for any given string
//INPUT: the text given after /echo
//OUTPUT: JSON with the text given after /echo
server.get('/echo/:name', (req, res) => {
	console.log(`Echoing ${req.params.name}`)
	res.send(req.params)
})

//Ping pong request
//INPUT: none beyond ping URL
//OUTPUT: JSON pong string
server.get('/ping', (req, res) => {
	console.log('Ping Request')
	res.send('Pong')
	exports.info.logEvent('Sent Pong back from ping request')
})

server.post('/questin', (req, res) => {
	console.log('Question In')
	const now = new Date()
	const time = now.getTime()
	const modCode = req.headers.code
	const question = req.body
	const qID = `${modCode}${time}q`
	const sqlStatement = `INSERT INTO questions VALUES ('${qID}', '${question}');`
	let modTest = false
	for (let i = 0; i < moduleTokens.length; i++) {
		if (modCode == moduleTokens[i]) {
			modTest = true
		}
	}
	if (modTest === false) {
		res.send('Error No Registered Module')
	}
	else {
		sql.query(sqlStatement, (err, rows) => {
			if (err) {
				throw new Error(err)
			} else {
				res.send(`Question sent with ID: ${qID}`)
				/*sql.query(`SELECT user_id FROM users WHERE module_id='${modCode}'`, (err, rows) => {
					if (err) {
						console.log(err)
					} else {
						const clients = []
						for (let o in rows) {
							clients.push(rows[o])
						}
						const iOSQuestion = {
							id: qID,
							quest: question
						}
						for (let u in clients) {
							io.on('connection', (clients[u]) => {
								client.on('event', (iOSQuestion) => {

								})
								client.on('disconnect', () => {

								})
							})
						}
					}
				})*/
			}
		})
	}
})

server.get('/input.html', restify.serveStatic({
	directory: './views',
	file: 'input.html'
}))

server.post('/register', (req, res) => {
	const mod = req.headers.module
	const udat = new Date()
	const unique = udat.getTime()
	const userCode = `${mod}${unique}u`
	const userSQL = `INSERT INTO users VALUES ('${userCode}', '${mod}');`
	sql.query(userSQL, (err, rows) => {
		if (err) {
			throw new Error(err)
		} else {
			res.send(userCode)
		}
	})
})

server.post('/answerin', (req, res) => {
	const qid = req.headers.qid
	const uid = req.headers.uid
	const answer = req.body.answer

})

io.on('connection', function(clientSocket){
  console.log('a user connected');

  clientSocket.on('disconnect', function(){
    console.log('user disconnected');

    var clientNickname;
    for (var i=0; i<userList.length; i++) {
      if (userList[i]["id"] == clientSocket.id) {
        userList[i]["isConnected"] = false;
        clientNickname = userList[i]["nickname"];
        break;
      }
    }

    delete typingUsers[clientNickname];
    io.emit("userList", userList);
    io.emit("userExitUpdate", clientNickname);
    io.emit("userTypingUpdate", typingUsers);
  });


  clientSocket.on("exitUser", function(clientNickname){
    for (var i=0; i<userList.length; i++) {
      if (userList[i]["id"] == clientSocket.id) {
        userList.splice(i, 1);
        break;
      }
    }
    io.emit("userExitUpdate", clientNickname);
  });


  clientSocket.on('chatMessage', function(clientNickname, message){
    var currentDateTime = new Date().toLocaleString();
    delete typingUsers[clientNickname];
    io.emit("userTypingUpdate", typingUsers);
    io.emit('newChatMessage', clientNickname, message, currentDateTime);
  });


  clientSocket.on("connectUser", function(clientNickname) {
      var message = "User " + clientNickname + " was connected.";
      console.log(message);

      var userInfo = {};
      var foundUser = false;
      for (var i=0; i<userList.length; i++) {
        if (userList[i]["nickname"] == clientNickname) {
          userList[i]["isConnected"] = true
          userList[i]["id"] = clientSocket.id;
          userInfo = userList[i];
          foundUser = true;
          break;
        }
      }

      if (!foundUser) {
        userInfo["id"] = clientSocket.id;
        userInfo["nickname"] = clientNickname;
        userInfo["isConnected"] = true
        userList.push(userInfo);
      }

      io.emit("userList", userList);
      io.emit("userConnectUpdate", userInfo)
  });


  clientSocket.on("startType", function(clientNickname){
    console.log("User " + clientNickname + " is writing a message...");
    typingUsers[clientNickname] = 1;
    io.emit("userTypingUpdate", typingUsers);
  });


  clientSocket.on("stopType", function(clientNickname){
    console.log("User " + clientNickname + " has stopped writing a message...");
    delete typingUsers[clientNickname];
    io.emit("userTypingUpdate", typingUsers);
  });

});
