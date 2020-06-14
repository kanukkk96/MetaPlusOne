<<<<<<< HEAD

import app from '../../server/app'
// import { Server } from 'http'
import axios from 'axios'
import qs from 'querystring'

// import config from '../../server/config'
import { getUrl } from '../../server/test-utils'

// const port = config.server.port

describe.skip('subscription service', () => {
  // let server: Server

  beforeAll(() => {
    // server = app.listen(port)
    // server.once('listening', () => done())
  })

  afterAll(() => {
    // server.close(done)
=======
import app from '../../server/app'
import { Server } from 'http'
import axios from 'axios'
import qs from 'querystring'

import config from '../../server/config'
import { getUrl } from '../../server/test-utils'

const port = config.server.port

describe('subscription service', () => {
  let server: Server

  beforeEach(done => {
    server = app.listen(port)
    server.once('listening', () => done())
  })

  afterEach(done => {
    server.close(done)
>>>>>>> Added old tests, converted to Jest from Mocha, 60% of tests passing
  })

  it('registered the service', () => {
    const service = app.service('subscription')

    expect(service).toBeTruthy()
  })

  it('should return 401 if sent without authToken', async () => {
    try {
      const response = await axios.post(getUrl('/subscription'), {
        planId: 'journey'
      })
      expect(response.status).toBe(401)
    } catch (error) {
      const { response } = error
      expect(response.status).toBe(401)
    }
  })

  it('should return payment url if sent with authToken', async () => {
    try {
      const token = 'a_valid_jwt_token'
      const response = await axios({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`
        },
        data: qs.stringify({ planId: 'journey' }),
        url: getUrl('/subscription')
      })
      expect(response.status).toBe(201)
    } catch (error) {
      const { response } = error
      expect(response.status).toBe(500)
    }
  })
})
