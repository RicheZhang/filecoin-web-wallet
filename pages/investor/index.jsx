import useDesktopBrowser from '../../lib/useDesktopBrowser'
import InvestorView from '../../components/Investor'

export default () => {
  useDesktopBrowser()
  return <InvestorView />
}
