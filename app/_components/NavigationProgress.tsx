'use client'

import { AppProgressBar } from 'next-nprogress-bar'

export default function NavigationProgress() {
  return (
    <AppProgressBar
      height="2px"
      color="#10B981"
      options={{ showSpinner: false, easing: 'ease', speed: 300 }}
      shallowRouting
    />
  )
}
