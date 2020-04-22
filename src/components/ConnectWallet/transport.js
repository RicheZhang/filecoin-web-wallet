import TransportWebHID from '@ledgerhq/hw-transport-webhid'
import TransportWebUSB from '@ledgerhq/hw-transport-webusb'

export default () =>
  new Promise((resolve, reject) => {
    TransportWebHID.create()
      .then(resolve)
      .catch((err) => {
        console.log(
          'error created webHID transport, falling back to webUSB: ',
          err,
          err.message
        )
        if (
          err.message.toLowerCase().includes('navigator.hid is not supported')
        ) {
          return TransportWebUSB.create()
        }
        if (
          err.message.toLowerCase().includes('transporterror: invalid channel')
        ) {
          reject(
            new Error(
              'Lost connection with Ledger. Please unplug and replug device.'
            )
          )
        }
        reject(err)
      })
      .then(resolve)
      .catch(reject)
  })
