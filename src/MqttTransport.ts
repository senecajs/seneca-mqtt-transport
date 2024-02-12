/* Copyright © 2024 Seneca Project Contributors, MIT License. */

type Options = {
  debug: boolean
  log: any[]
  prefix: string
  suffix: string
}

// Default options.
const defaults: Options = {
  debug: false,
  log: [],
  prefix: '',
  suffix: '',
}

function MqttTransport(this: any, options: Options) {
  const seneca: any = this

  return {
    exports: {},
  }
}

Object.assign(MqttTransport, { defaults })

export default MqttTransport

if ('undefined' !== typeof module) {
  module.exports = MqttTransport
}
