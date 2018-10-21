'use strict'
module.exports = {
  NODE_ENV: '"production"',
  COGNITO_REGION: "'"+process.env.COGNITO_REGION+"'",
  COGNITO_IDENTITY_POOL_ID: "'"+process.env.COGNITO_IDENTITY_POOL_ID+"'",
  COGNITO_USER_POOL_ID: "'"+process.env.COGNITO_USER_POOL_ID+"'",
  COGNITO_CLIENT_ID: "'"+process.env.COGNITO_CLIENT_ID+"'",
  GRAPHQL_ENDPOINT: "'"+process.env.GRAPHQL_ENDPOINT+"'",
  APP_SYNC_REGION: "'"+process.env.APP_SYNC_REGION+"'",
  APP_SYNC_API_KEY: "'"+process.env.APP_SYNC_API_KEY+"'"
}
