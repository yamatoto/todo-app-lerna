import Fastify, { FastifyInstance, RouteShorthandOptions } from 'fastify'
import cors from '@fastify/cors'

const server: FastifyInstance = Fastify({})
server.register(cors, {
    // origin: true
    origin: "http://localhost:3000"
});

const opts: RouteShorthandOptions = {
    schema: {
        response: {
            200: {
                type: 'object',
                properties: {
                    hoge: {
                        type: 'string'
                    },
                    fuga: {
                        type: 'number'
                    }
                }
            }
        }
    }
}


server.get('/', opts, async () => {
    return {
        hoge: 'hoge!',
        fuga: '1111',
        piyo: 'piyo!'
    }
})

const start = async () => {
    try {
        await server.listen({ port: 3001, host: "0.0.0.0" })

        const address = server.server.address()
        const port = typeof address === 'string' ? address : address?.port
        console.log('running port:', port)

    } catch (err) {
        server.log.error(err)
        process.exit(1)
    }
}

start()