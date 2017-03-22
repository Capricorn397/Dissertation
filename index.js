'use strict'

const apn  = require('apn')
const http = require('http')
const database = require('mysql')
const restify = require('restify')
const error = ''
const socketio = require('socket.io')
const port = 8000
const firstArray = 0
const twoDP = 2
const fsTopTen = 10
const server = restify.createServer({
	name: 'Dissertation_Server',
	version: '0.0.5'
})
const io = socketio.listen(server);

const options = {
	cert: "./pushCert.pem",
	key: "./appPushCert.p12",
	passphrase: "coventry",
  production: false
};

const apnProvider = new apn.Provider(options);

const questionStore = {}
const answerStoreWord = {}
const answerStoreYN = [0,0]
const answerStoreTF = [0,0]
const moduleTokens = ['340ct', '380ct', '370ct']
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

io.sockets.on('connection', function (socket) {
	console.log('In connection area of io')
	socket.emit('news', { hello: 'world' })
	socket.on('my other event', function (data) {
    console.log(data)
  })
})

server.listen(8000, () => {
	console.log('socket.io server listening at %s', server.url)
})

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
				var note = new apn.Notification();
				let deviceToken = "4DC1D0B7BD86E9ED61918A03CAA0B3EAB869EE576239A061033274FBDB2AF4A8"
				note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
				note.badge = 3;
				note.sound = "ping.aiff";
				note.alert = "\uD83D\uDCE7 \u2709 You have a new message";
				note.payload = {'messageFrom': 'John Appleseed'};
				note.topic = "chris.capricorn.Dissertation-1";
				apnProvider.send(note, deviceToken).then( (err, result) => {
					if (err) {
						console.log(error)
					}
					console.log(result)
					console.log('Sent Notification')
				});
			}
		})
	}
})

server.get('/input.html', restify.serveStatic({
	directory: './views',
	file: 'input.html'
}))

server.get('/answerViewer.html', restify.serveStatic({
	directory: './views',
	file: 'answerViewer.html'
}))

server.get('/wordcloud.js', restify.serveStatic({
	directory: './node_modules/wordcloud/src',
	file: 'wordcloud2.js'
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
	console.log(req.body)
	const answerStatement = `INSERT INTO answers VALUES ('${qid}', '${uid}', '${answer}');`
	console.log(`Saw ${qid}, ${uid}, ${answer}`)
	//sql.query(answerStatement, (err, rows) => {
		//if (err) {
			//throw new Error(err)
		//} else {
		//	res.send('Answer Submitted')
		//}
	//})
	res.send("Recieved")
})

server.get('/question', (req, res) => {
	console.log('Question Get')
	var listedQuestions = []
	const module = req.headers.mod
	console.log(module)
	const statement = `SELECT * FROM questions WHERE question_id LIKE '%${module}%';`
	console.log(statement)
	sql.query(statement, (err, rows) => {
		if (err) {
			console.log(err)
			throw new Error(err)
		} else {
			console.log(rows)
			var i = 0
			var tempobj = {}
			for (let h in rows) {
				tempobj = {'id': rows[h].question_id, 'question': rows[h].question}
				listedQuestions.push(tempobj)
				i++
			}
			console.log(listedQuestions)
		}
		res.send(listedQuestions)
	})
})

server.get('allAnswers', (req,res) => {
	const questionID = req.headers.qid
	const allAnsState = `SELECT answer FROM answers WHERE question_id like '${questionID}';`
	var allAnswers = [[]]
	var temp = []
	sql.query(allAnsState, (err, rows) => {
		if (err) {
			throw new Error(err)
		} else {
			for (let r in rows) {
				temp.push(rows[r].answer)
			}
			for (let q in temp) {
				allAnswers[q] = [temp[q], 10]
			}
			res.send(allAnswers)
		}
	})
})
