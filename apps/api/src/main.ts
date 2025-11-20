import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'

async function bootstrap() {
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
