/* Copyright © 2022-2024 Seneca Project Contributors, MIT License. */

import Seneca from 'seneca'
// import SenecaMsgTest from 'seneca-msg-test'
// import { Maintain } from '@seneca/maintain'

import MqttTransportDoc from '../src/MqttTransportDoc'
// import MqttTransport from '../src/MqttTransport'

describe('mqtt-transport', () => {
  test('happy', async () => {
    expect(MqttTransportDoc).toBeDefined()
    const seneca = Seneca({ legacy: false })
      .test()
      .use('promisify')
      .use('entity')
    // todo: set up jest test for the mqtt connection
    // .use(MqttTransport)
    await seneca.ready()
  })
})
