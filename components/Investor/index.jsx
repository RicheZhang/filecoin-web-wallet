import React from 'react'
import Ledger from '../Onboarding/Configure/Ledger'
import { Box } from '../Shared'

export default () => {
  return (
    <Box
      display='flex'
      minHeight='100vh'
      justifyContent='center'
      alignContent='center'
      padding={[2, 3, 5]}
    >
      <Ledger investor />
    </Box>
  )
}
