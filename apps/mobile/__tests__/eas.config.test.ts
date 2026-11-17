import { readFileSync } from 'fs'
import { join } from 'path'

const eas = JSON.parse(readFileSync(join(__dirname, '..', 'eas.json'), 'utf8'))

describe('eas.json', () => {
  it('lets EAS manage versionCode remotely', () => {
    expect(eas.cli.appVersionSource).toBe('remote')
  })

  it('builds the development profile as the dev variant with a dev client', () => {
    expect(eas.build.development).toMatchObject({
      developmentClient: true,
      distribution: 'internal',
      env: { APP_VARIANT: 'development' },
    })
  })

  it('never sets APP_VARIANT on preview or production', () => {
    expect(eas.build.preview.env?.APP_VARIANT).toBeUndefined()
    expect(eas.build.production.env?.APP_VARIANT).toBeUndefined()
  })

  it('builds preview as an internally distributed APK', () => {
    expect(eas.build.preview).toMatchObject({
      distribution: 'internal',
      android: { buildType: 'apk' },
    })
  })

  it('builds production as an auto-incremented AAB', () => {
    expect(eas.build.production.autoIncrement).toBe(true)
    expect(eas.build.production.android?.buildType ?? 'app-bundle').toBe('app-bundle')
  })

  it('submits production to the internal track with the gitignored key', () => {
    expect(eas.submit.production.android).toEqual({
      track: 'internal',
      serviceAccountKeyPath: './secrets/play-service-account.json',
    })
  })
})
