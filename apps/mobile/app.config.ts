import type { ConfigContext, ExpoConfig } from 'expo/config'

const PROD_ID = 'com.ikjun.pomobox'
const DEV_ID = `${PROD_ID}.dev`

export default ({ config }: ConfigContext): ExpoConfig => {
  const isDev = process.env.APP_VARIANT === 'development'
  const appId = isDev ? DEV_ID : PROD_ID

  return {
    ...config,
    name: isDev ? 'Pomobox (Dev)' : 'Pomobox',
    slug: 'pomobox',
    scheme: 'pomobox',
    ios: { ...config.ios, bundleIdentifier: appId },
    android: { ...config.android, package: appId },
  }
}
