const express = require('express')
const valid = require('card-validator')
const http = require('http')
var validator = require('email-validator')
const {phone} = require('phone')
const bodyParser = require('body-parser')

const app = express()

app.use(bodyParser.json())

app.post('/transaction', (req, res) => {
    console.log(req.body)

    Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === "string" && req.body[key].trim() === "") {
            res.statusCode = 406
            return res.send("missing fields")
        }
        if (key === "name") {
            var hasNumber = /\d/
            if(hasNumber.test(req.body[key])) { // returns true if string contains number
                res.statusCode = 406
                return res.send("error: invalid name")
            }
        }
        if (key === "email") {
            if(!validator.validate(req.body[key])) {
                res.statusCode = 406
                return res.send("error: invalid email")
            }
        }
        if (key === "phone_number") {
            let phoneData = phone(req.body[key])
            if (!phoneData.isValid) {
                res.statusCode = 406
                return res.send("error: invalid phone number")
            }
        }
    })

    if (req.body.card) {
        Object.keys(req.body.card).forEach(key => {
            if (key === "date") {
                if (req.body.card[key].includes('/')) {
                    const validation = req.body.card[key].split('/')
                    for (let i = 0; i < validation.length; i++) {
                        let value = parseInt(validation[i])
                        if (typeof value === "number") {
                            if (validation.length < 2 || validation.length > 2) {
                                res.statusCode = 406
                                return res.send("error: wrong validation date")
                            }
                        } else {
                            res.statusCode = 406
                            return res.send("error: wrong validation date")
                        }
                    }
                } else {
                    res.statusCode = 403
                    return res.send("error: invalid operation")
                }
            }
            if (key === "number") {
                const numericInput = req.body.card[key].replace(/\D/g, '') // removes all non-numeric characters from the input string
                const int = parseInt(numericInput)

                var numberValid = valid.number(int)
                if (!numberValid.isValid) {
                    res.statusCode = 406
                    return res.send("error: card invalid")
                }
            }
            if (key === "security") {
                const securityCode = req.body.card[key]
                var isDigit = /^\d+$/

                if (typeof securityCode  === "string" && securityCode.length === 3) {
                    if (!isDigit.test(securityCode)) {
                        res.statusCode = 406
                        return res.send("error: invalid security code")
                    }
                } else {
                    res.statusCode = 406
                    return res.send("error: invalid security code")
                }    
            }
            if (key === "name") {
                var hasNumber = /\d/
                if(hasNumber.test(req.body.card[key])) { // returns true if string contains number
                    res.statusCode = 406
                    return res.send("error: invalid card name")
                }
            }
        }) 
    }
    
    var options, post_data
    Object.keys(req.body).forEach(key => {
        if (key === "reservationChoice" && req.body[key] === "Hotel") {
            post_data = `{
                nome_cliente: req.body.name,
                email_client: req.body.email,
                telefone_cliente: req.body.phone,
                tipo_quarto: req.body.room,
                check_in: req.body.check_in,
                check_out: req.body.check_out,
                status: req.body.status
            }`
            options = {
                host: "0.0.0.0",
                port: "8000",
                path: "/reservas/",
                method: "POST",
                headers: {
                    'Content-Type': 'application/json' 
                }
            }
        } else {
            // Flight header options
        }
    })

    // send HTTP POST request to Database Server
    const post_req = http.request(options, (response) => {
        console.log(`Status code: ${res.statusCode}`)

        var responseData = ''
        response.on('data', (data) => { // listen on data
            responseData += data
        })
        response.on('end', () => {
            res.send(responseData)
        })
    })
    post_req.on('error', (error) => { // in case of an error
        console.log(`Error sending request: ${error.message}`)
    })
    post_req.write(post_data)
    post_req.end()
})

app.get('/reservateHotel', (req, res) => {
    const options = {
        host: "0.0.0.0",
        port: "8000",
        path: "/reservas/",
        method: "GET",
    }

    // get a HTTP GET request from Database Server 
    const get_req = http.request(options, (response) => {
        console.log(`\nStatus code: ${res.statusCode}`)

        var responseData = ''
        response.on('data', (chunk) => { // collect the data from the response
            responseData += chunk
        })
        response.on('end', () => { // when the entire response has been received
            //res.send(responseData)
        })
    })
    get_req.on('error', (error) => {
        console.log(`Error making HTTP request to other server: ${error.message}`)
    })
    get_req.end() // End the request to the other server
})

const server = http.createServer(app)
let port = 3001
const host = '127.0.0.1'

server.listen(port, host, () => {
    console.log(`Servidor a rodar em http://${host}:${port}/`)
})