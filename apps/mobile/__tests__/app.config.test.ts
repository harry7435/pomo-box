import type { ConfigContext, ExpoConfig } from 'expo/config'

import getConfig from '../app.config'

const baseConfig: Partial<ExpoConfig> = {
  name: 'Pomobox',
  slug: 'pomobox',
  scheme: 'pomobox',
  android: { adaptiveIcon: { backgroundColor: '#ffffff' } },
  ios: { supportsTablet: true },
  plugins: ['expo-router'],
}

const originalVariant = process.env.APP_VARIANT

function resolveWith(variant: string | undefined): ExpoConfig {
  if (variant === undefined) {
    delete process.env.APP_VARIANT
  } else {
    process.env.APP_VARIANT = variant
  }
  return getConfig({ config: baseConfig } as ConfigContext)
}

afterEach(() => {
  if (originalVariant === undefined) {
    delete process.env.APP_VARIANT
  } else {
    process.env.APP_VARIANT = originalVariant
  }
})

describe('app.config', () => {
  it('uses dev name and ids when APP_VARIANT=development', () => {
    const config = resolveWith('development')
    expect(config.name).toBe('Pomobox (Dev)')
    expect(config.android?.package).toBe('com.ikjun.pomobox.dev')
    expect(config.ios?.bundleIdentifier).toBe('com.ikjun.pomobox.dev')
  })

  it('uses prod name and ids when APP_VARIANT is unset', () => {
    const config = resolveWith(undefined)
    expect(config.name).toBe('Pomobox')
    expect(config.android?.package).toBe('com.ikjun.pomobox')
    expect(config.ios?.bundleIdentifier).toBe('com.ikjun.pomobox')
  })

  it.each(['production', 'dev', 'Development', ''])('treats APP_VARIANT=%p as production', (variant) => {
    const config = resolveWith(variant)
    expect(config.name).toBe('Pomobox')
    expect(config.android?.package).toBe('com.ikjun.pomobox')
  })

  it('shares slug and scheme across variants', () => {
    expect(resolveWith('development').slug).toBe('pomobox')
    expect(resolveWith(undefined).slug).toBe('pomobox')
    expect(resolveWith('development').scheme).toBe('pomobox')
  })

  it('preserves static android, ios and plugin fields from app.json', () => {
    const config = resolveWith('development')
    expect(config.android?.adaptiveIcon).toEqual({ backgroundColor: '#ffffff' })
    expect(config.ios?.supportsTablet).toBe(true)
    expect(config.plugins).toEqual(['expo-router'])
  })
})
