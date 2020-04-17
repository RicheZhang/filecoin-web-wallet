import { useEffect, useCallback, useRef } from 'react'
import { useDispatch } from 'react-redux'
import axios from 'axios'
import { FilecoinNumber } from '@openworklabs/filecoin-number'

import useWallet from '../WalletProvider/useWallet'
import { updateBalance, error as rdxError } from '../store/actions'
import { FILSCOUT, ONE_MINUTE } from '../constants'

export default () => {
  const dispatch = useDispatch()
  const wallet = useWallet()
  const timeout = useRef()

  const pollBalance = useCallback(
    (address, balance) => {
      // avoid race conditions (heisman)
      clearTimeout(timeout.current)
      timeout.current = setTimeout(async () => {
        const { data } = await axios.get(
          `${FILSCOUT}/account/by_address/${address}`
        )
        if (data.code === 200) {
          const latestBalance = new FilecoinNumber(
            data.data.account.balance,
            'fil'
          )
          if (!latestBalance.isEqualTo(balance)) {
            dispatch(updateBalance(latestBalance, wallet.index))
          }
          return pollBalance(wallet.address, latestBalance)
        }

        dispatch(rdxError(data.error))
      }, ONE_MINUTE)

      return () => {
        if (timeout.current) {
          clearTimeout(timeout.current)
        }
      }
    },
    [dispatch, wallet.index, wallet.address]
  )

  useEffect(() => {
    if (wallet.index >= 0) {
      pollBalance(wallet.address, wallet.balance)
    }
  }, [wallet.address, wallet.balance, wallet.index, pollBalance])

  return null
}
