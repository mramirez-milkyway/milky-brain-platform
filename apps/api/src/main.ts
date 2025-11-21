import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'

/**
 * Validate required environment variables
 */
function validateEnvironment() {
  const isProduction = process.env.NODE_ENV === 'production'
  const requiredVars = ['JWT_SECRET', 'DATABASE_URL', 'REDIS_URL']

  if (isProduction) {
    requiredVars.push('REFRESH_TOKEN_SECRET', 'ALLOWED_INVITE_DOMAINS')
  }

  const missing = requiredVars.filter((varName) => !process.env[varName])

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. Please check your .env file.`
    )
  }

  // Warn about missing refresh token secret in development
  if (!isProduction && !process.env.REFRESH_TOKEN_SECRET) {
    console.warn('⚠️  REFRESH_TOKEN_SECRET not set. Using default (NOT FOR PRODUCTION)')
  }

  // Warn about missing domain restriction in development
  if (!isProduction && !process.env.ALLOWED_INVITE_DOMAINS) {
    console.warn('⚠️  ALLOWED_INVITE_DOMAINS not set. Defaulting to milkyway-agency.com')
  }
}

async function bootstrap() {
  // Validate environment before starting
  validateEnvironment()

  const app = await NestFactory.create(AppModule)

  // Security
  app.use(helmet())
  app.use(cookieParser())

  // CORS - Allow multiple frontend origins
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004',
  ]

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true)

      // Check if origin is in allowed list or matches env variable
      if (allowedOrigins.includes(origin) || origin === process.env.FRONTEND_URL) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
  })

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  )

  // Global prefix
  app.setGlobalPrefix('api')

  const port = process.env.PORT || 4000
  await app.listen(port)

  console.log(`🚀 API running on http://localhost:${port}/api`)
}

bootstrap()
