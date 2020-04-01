import { useEffect, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import axios from 'axios'

import {
  fetchedConfirmedMessagesSuccess,
  fetchedConfirmedMessagesFailure,
  fetchingConfirmedMessages,
  fetchingNextPage
} from '../../../store/actions'
import { FILSCAN } from '../../../constants'
import formatFilscanMessages from './formatFilscanMessages'
import useWallet from '../../../WalletProvider/useWallet'
import { useWalletProvider } from '../../../WalletProvider'

const PAGINATION_COUNT = 8

export default () => {
  const { address } = useWallet()
  const { walletProvider } = useWalletProvider()
  const dispatch = useDispatch()
  const {
    loading,
    loadedSuccess,
    loadedFailure,
    pending,
    confirmed,
    total,
    paginating
  } = useSelector(state => {
    return {
      ...state.messages,
      confirmed: state.messages.confirmed.map(message => ({
        ...message,
        status: 'confirmed'
      })),
      pending: state.messages.pending.map(message => ({
        ...message,
        status: 'pending'
      }))
    }
  })

  const fetchPendingMsgs = useCallback(
    async address => {
      const res = await walletProvider.jsonRpcEngine.request(
        'MpoolPending',
        null
      )

      const relevantMessages = res.reduce((accum, { Message }) => {
        if (Message.From === address || Message.To === address)
          accum.push(Message)
        return accum
      }, [])

      console.log(relevantMessages)
    },
    [walletProvider]
  )

  const fetchConfirmedMsgHistory = useCallback(
    async (address, total, cachedCount) => {
      if (total === cachedCount) return
      try {
        const { data } = await axios.post(
          `${FILSCAN}/messages/MessageByAddress`,
          {
            method: '',
            begindex: cachedCount,
            count: PAGINATION_COUNT,
            address,
            from_to: ''
          }
        )

        // filscan reports 3 as success code https://github.com/filecoin-shipyard/filscan-backend/blob/master/Filscan_Interface_v1.0.md#2public-response-parameters
        if (data.res.code !== 3) {
          dispatch(
            fetchedConfirmedMessagesFailure(
              new Error('Error fetching from Filscan: ', data.res.msg)
            )
          )
        } else {
          const formattedMessages = formatFilscanMessages(data.data.data)
          dispatch(
            fetchedConfirmedMessagesSuccess(
              formattedMessages,
              Number(data.data.total)
            )
          )
        }
      } catch (err) {
        dispatch(fetchedConfirmedMessagesFailure(new Error(err.message)))
      }
    },
    [dispatch]
  )

  const showMore = useCallback(() => {
    dispatch(fetchingNextPage())
    fetchConfirmedMsgHistory(address, total, confirmed.length)
  }, [address, confirmed.length, total, fetchConfirmedMsgHistory, dispatch])

  useEffect(() => {
    if (!loading && !loadedFailure && !loadedSuccess) {
      dispatch(fetchingConfirmedMessages())
      fetchConfirmedMsgHistory(address, total, confirmed.length)
      fetchPendingMsgs(address)
    }
  }, [
    address,
    total,
    confirmed.length,
    loading,
    loadedFailure,
    loadedSuccess,
    fetchConfirmedMsgHistory,
    fetchPendingMsgs,
    dispatch
  ])

  return {
    loading,
    loadedSuccess,
    loadedFailure,
    pending,
    confirmed,
    showMore,
    paginating,
    total
  }
}
