'use strict'

const apn = require('apn')
const database = require('mysql')
const restify = require('restify')
const socketio = require('socket.io')
const port = 8000
const server = restify.createServer({
	name: 'Dissertation_Server',
	version: '1.0.0'
})
const io = socketio.listen(server)

const options = {
	pfx: "",//'./apn_developer_identity.p12', Removed as no file available
	passphrase: 'coventry',
	production: false

}

//const apnProvider = new apn.Provider(options) Not currently able to send notification

const moduleTokens = ['340ct', '380ct', '370ct', '207se']


const sql = database.createPool({
	user: 'mainServer',
	password: 'myDissertation',
	host: '217.182.64.177',
	port: 7999,
	database: 'dissertation',
	connectionLimit: 10
})

io.sockets.on('connection', function(socket) {
	console.log('In connection area of io')
	socket.emit('news', { hello: 'world' })
	socket.on('my other event', function(data) {
		console.log(data)
	})
})

server.listen(port, () => {
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
		if (modCode === moduleTokens[i]) {
			modTest = true
		}
	}
	if (modTest === false) {
		res.status(500)
		res.send('Error No Registered Module')
	} else {
		sql.query(sqlStatement, (err) => {
			if (err) {
				throw new Error(err)
			} else {
				res.send(`${qID}`)
				const sqlQuery = 'SELECT user_id FROM users'
				sql.query(sqlQuery, (err, rows) => {
					if (err) {
						throw new Error(err)
					} else {
						for (const g in rows) {
							console.log(rows[g])
							const note = new apn.Notification()
							note.expiry = Math.floor(Date.now() / 1000) + 3600
							note.badge = 1
							note.sound = 'ping.aiff'
							note.alert = 'You Have A New Question!'
							note.payload = {'messageFrom': 'Your Lecturer'}
							note.topic = 'chris.capricorn.Dissertation-1'
							const deviceToken = rows[g].user_id
							//Disabled as not available
							//apnProvider.send(note, deviceToken).then( (result) => {
								//console.log(result)
							//})
						}
					}
				})
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
	const mod = 'newStyle'
	const userCode = req.headers.pushtoken
	const userSQL = `INSERT INTO users VALUES ('${userCode}', '${mod}');`
	sql.query(userSQL, (err) => {
		if (err) {
			throw new Error(err)
		} else {
			console.log('Registered Device For Push Notifications')
			res.send('Registered')
		}
	})
})

server.post('/answerin', (req, res) => {
	console.log('Answer In')
	const qid = req.headers.qid
	const uid = req.headers.uid
	const answer = req.body.answer
	const answerStatement = `INSERT INTO answers VALUES ('${qid}', '${uid}', '${answer}');`
	console.log(answerStatement)
	sql.query(answerStatement, (err) => {
		if (err) {
			throw new Error(err)
		} else {
			console.log('Answer Added')
			res.send('Answer Submitted')
		}
	})
	res.send('Recieved')
})

server.get('/question', (req, res) => {
	console.log('Question Get')
	const listedQuestions = []
	const module = req.headers.mod
	const statement = `SELECT * FROM questions WHERE question_id LIKE '%${module}%';`
	sql.query(statement, (err, rows) => {
		if (err) {
			console.log(err)
			throw new Error(err)
		} else {
			let tempobj = {}
			for (const h in rows) {
				tempobj = {'id': rows[h].question_id, 'question': rows[h].question}
				listedQuestions.push(tempobj)
			}
		}
		res.send(listedQuestions)
	})
})

server.get('allAnswers', (req,res) => {
	const questionID = req.headers.qid
	const allAnsState = `SELECT answer FROM answers WHERE question_id like '${questionID}';`
	const allAnswers = [[]]
	allAnswers.pop()
	const temp = []
	sql.query(allAnsState, (err, rows) => {
		if (err) {
			throw new Error(err)
		} else {
			for (const r in rows) {
				temp.push(rows[r].answer)
			}
			let add = true
			for (const q in temp) {
				add = true
				for (const z in allAnswers){
					if (temp[q] === allAnswers[z][0]) {
						allAnswers[z][1] = allAnswers[z][1] + 2
						add = false
					}
				}
				if (add === true) {
					allAnswers.push([temp[q], 10])
				}
			}
			console.log(allAnswers)
			res.send(allAnswers)
		}
	})
})
