import express, {
  type Application,
  type Request,
  type Response,
} from 'express';
import cors, { type CorsOptions } from 'cors';
import cookieParser from 'cookie-parser';
import expressSession from 'express-session';
import morgan from 'morgan';
import { router } from './routes';
import notFound from './middlewares/notFound';
import globalErrorHandler from './middlewares/globalErrorHandler';

export const app: Application = express();
app.use(cookieParser());

const corsOptions: CorsOptions = {
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://nahid-mahmud.xyz',
  ], // Add both localhost variations
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true, // This is crucial for cookies
  optionsSuccessStatus: 200, // For legacy browser support
};

app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(express.json({ limit: '100mb' }));

app.use(
  expressSession({
    secret: process.env.SESSION_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: false,
  })
);
app.use(morgan('dev'));
app.set('trust proxy', 1);

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'API is running...',
    status: 'success',
  });
});

app.get('/api/v1', (req: Request, res: Response) => {
  res.json({
    message: 'You have reached the API v1 endpoint',
    status: 'success',
  });
});

app.use('/api/v1', router);

app.use(globalErrorHandler);
app.use(notFound);
