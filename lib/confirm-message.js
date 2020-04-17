import { useEffect, useCallback, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { FILSCOUT, ONE_MINUTE } from '../constants'

import { confirmedMessage } from '../store/actions'

export default () => {
  const dispatch = useDispatch()
  const { pendingMsgs } = useSelector(state => ({
    pendingMsgs: state.messages.pending
  }))
  const [registeredListeners, setRegisteredListeners] = useState(new Set([]))
  const timeouts = useRef()
  timeouts.current = {}

  const confirmMsg = useCallback(
    msgCid => {
      clearTimeout(timeouts.current[msgCid])
      timeouts.current[msgCid] = setTimeout(async () => {
        const { data } = await axios.get(`${FILSCOUT}/message/by_cid/${msgCid}`)
        // NEED MORE INFORMATION ABOUT ERROR AND SUCCESS CODES - WILL THEY RETURN 304'S 529'S...ETC?
        if (data.code === 200) return dispatch(confirmedMessage(msgCid))
        if (data.code === 404) return confirmMsg(msgCid)

        throw new Error(data.error)
      }, ONE_MINUTE)

      return () => {
        if (timeouts.current[msgCid]) {
          clearTimeout(timeouts.current[msgCid])
        }
      }
    },
    [dispatch]
  )

  useEffect(() => {
    if (pendingMsgs.length > 0) {
      pendingMsgs.forEach(msg => {
        if (!registeredListeners.has(msg.cid)) {
          setRegisteredListeners(registeredListeners.add(msg.cid))
          confirmMsg(msg.cid)
        }
      })
    }
  })

  return null
}
