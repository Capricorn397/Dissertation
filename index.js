'use strict'

const restify = require('restify')
const error = ''
const port = 8000
const firstArray = 0
const twoDP = 2
const fsTopTen = 10
const server = restify.createServer({
	name: 'Dissertation_Server',
	version: '0.0.1'
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
	const modCode = req.headers.code
	const question = req.body
	let modTest = false
	for i in moduleTokens {
		if modCode === moduleTokens[i]{
			modTest = true
		}
	}
	if modTest === false {
		res.send('Error No Registered Module')
	}
	else {
		questionStore[modCode] = question
		console.log(questionStore)
		res.send('Complete')
	}
})

server.get('/input.html', restify.serveStatic({
	directory: './views',
	file: 'input.html'
}))
