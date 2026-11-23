const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)
// drizzle-kit이 만든 마이그레이션 .sql 파일을 번들에 포함한다.
config.resolver.sourceExts.push('sql')

module.exports = config
