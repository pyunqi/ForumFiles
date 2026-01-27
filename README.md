# ForumFiles

A secure file upload and download management system with user authentication, admin dashboard, email sharing, and public download links.

## Features

### User Features
- Email-based authentication (password or verification code login)
- File upload (up to 100MB) with optional description
- View, download, and delete own files
- Search and pagination for file listings

### Admin Features
- User management (view all users, activate/deactivate accounts)
- File management (view all files, share via email, delete files)
- Generate password-protected public download links
- Configurable link expiration (1/3/7 days or never)
- Download limit enforcement

### Public Download
- Password-protected public file download
- Link expiration and download limit enforcement
- Clean, responsive download page

### Security
- JWT authentication with bcrypt password hashing
- File security validation (MIME type, magic number, size limits)
- SQL injection prevention with parameterized queries
- Rate limiting on authentication and upload endpoints
- CORS configuration for iframe embedding support

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite
- **Authentication**: JWT + bcrypt
- **File Upload**: Multer
- **Email**: Nodemailer
- **Security**: express-rate-limit, file-type validation

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Routing**: React Router
- **HTTP Client**: Axios
- **Styling**: CSS3 with CSS Variables

## Project Structure

```
ForumFiles/
├── client/                 # React frontend
│   ├── src/
│   │   ├── api/           # API client functions
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── styles/        # CSS styles
│   │   ├── types/         # TypeScript types
│   │   ├── App.tsx        # Main app component
│   │   └── main.tsx       # Entry point
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── utils/         # Utilities
│   │   ├── app.ts         # Express app setup
│   │   └── server.ts      # Server entry point
│   ├── scripts/           # Database initialization
│   ├── package.json
│   └── tsconfig.json
│
├── .gitignore
├── README.md
└── zeabur.yaml            # Zeabur deployment config
```

## Local Development

### Prerequisites
- Node.js 18+ and npm
- SMTP server credentials (for email features)

### Backend Setup

1. Navigate to server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Edit `.env` and configure:
   - `JWT_SECRET`: Strong random secret for JWT
   - `SMTP_*`: Your email server credentials
   - `ADMIN_EMAIL` and `ADMIN_PASSWORD`: Initial admin account

5. Initialize database (creates tables and admin account):
```bash
npm run init-db
```

6. Start development server:
```bash
npm run dev
```

Backend will run on `http://localhost:3000`

### Frontend Setup

1. Navigate to client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
echo "VITE_API_URL=http://localhost:3000" > .env
```

4. Start development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

### First Login

After setup, log in with the admin account you configured:
- Email: (value from `ADMIN_EMAIL` in server `.env`)
- Password: (value from `ADMIN_PASSWORD` in server `.env`)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email and password
- `POST /api/auth/send-verification-code` - Request email verification code
- `POST /api/auth/verify-code-login` - Login with verification code
- `GET /api/auth/me` - Get current user info

### Files
- `POST /api/files/upload` - Upload file (with description)
- `GET /api/files/my-files` - Get user's files (paginated)
- `GET /api/files/:id` - Get file details
- `GET /api/files/:id/download` - Download file
- `DELETE /api/files/:id` - Delete file

### Admin
- `GET /api/admin/users` - Get all users (paginated)
- `GET /api/admin/files` - Get all files (paginated)
- `PUT /api/admin/users/:id/toggle-status` - Activate/deactivate user
- `DELETE /api/admin/files/:id` - Delete any file
- `POST /api/admin/share-file` - Share file via email
- `POST /api/admin/generate-link` - Generate public download link

### Public
- `GET /api/public/link/:linkCode` - Get public link info
- `POST /api/public/link/:linkCode/download` - Download with password

## Deployment to Zeabur

### Prerequisites
- GitHub account
- Zeabur account

### Steps

1. **Push to GitHub**:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/forumfiles.git
git push -u origin main
```

2. **Create Zeabur Project**:
   - Go to [Zeabur Dashboard](https://dash.zeabur.com)
   - Create new project
   - Connect your GitHub repository

3. **Add Backend Service**:
   - Service type: Node.js
   - Root directory: `server`
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
   - Set environment variables from `server/.env.example`
   - Add persistent storage volume mounted at `/data` for database and uploads

4. **Add Frontend Service**:
   - Service type: Static
   - Root directory: `client`
   - Build command: `npm install && npm run build`
   - Output directory: `dist`
   - Set `VITE_API_URL` to your backend service URL

5. **Configure Environment Variables** (Backend):
```
NODE_ENV=production
JWT_SECRET=(generate strong random secret)
DATABASE_PATH=/data/forum_files.db
UPLOAD_DIR=/data/uploads
SMTP_HOST=(your SMTP host)
SMTP_PORT=587
SMTP_USER=(your SMTP username)
SMTP_PASS=(your SMTP password)
SMTP_FROM=(sender email)
ALLOWED_ORIGINS=(your frontend URL)
ADMIN_EMAIL=(admin email)
ADMIN_PASSWORD=(strong admin password)
```

6. **Deploy and Initialize**:
   - Deploy both services
   - Backend will automatically run database initialization on first start
   - Access your frontend URL to start using the app

## Email Configuration

### Gmail Setup
1. Enable 2-factor authentication on your Google account
2. Generate an App Password:
   - Go to Google Account > Security > 2-Step Verification > App passwords
   - Select "Mail" and your device
   - Copy the generated password
3. Use in `.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Other SMTP Providers
- **SendGrid**: Use API key as password
- **Mailgun**: Use SMTP credentials from dashboard
- **AWS SES**: Use SMTP credentials from IAM

## Security Considerations

1. **JWT Secret**: Use a strong random secret (32+ characters)
2. **Admin Password**: Change default admin password immediately
3. **CORS**: Only allow trusted origins in production
4. **HTTPS**: Always use HTTPS in production (Zeabur provides this)
5. **File Uploads**: Limits are enforced at 100MB, adjust if needed
6. **Rate Limiting**: Current limits can be adjusted in `middleware/rateLimiter.ts`

## License

MIT License

## Support

For issues and questions, please create an issue in the GitHub repository.
