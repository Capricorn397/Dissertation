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
	const qID = `q${modCode}${time}`
	const sqlStatement = `INSERT INTO questions ('${qID}', '${question}');`
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
				new error('SQL Error')
			} else {
				res.send(`Question sent with ID: ${qID}`)
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
	const unique = 'thing'//Get number from sql
	const userCode = mod + unique
	//Store user in database
	res.send(userCode)
})
