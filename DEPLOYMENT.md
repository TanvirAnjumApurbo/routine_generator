# 🚀 Deployment Guide for Render

This guide will help you deploy the Exam Routine Generator to Render.

## 📋 Prerequisites

1. A [Render](https://render.com) account (free tier available)
2. Your project pushed to a GitHub repository
3. All deployment files are included in your repository

## 📁 Deployment Files Included

The following files have been added to prepare your project for Render deployment:

- **`Procfile`**: Tells Render how to start your application
- **`render.yaml`**: Configuration file for Render services
- **`runtime.txt`**: Specifies the Python version to use
- **`requirements.txt`**: Updated with `gunicorn` for production server
- **Updated `app.py`**: Modified to work with Render's environment variables

## 🔧 Deployment Steps

### Step 1: Connect to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Sign up or log in to your account
3. Click **"New +"** and select **"Web Service"**

### Step 2: Connect Your Repository

1. Choose **"Build and deploy from a Git repository"**
2. Connect your GitHub account if not already connected
3. Select your `routine_generator` repository
4. Click **"Connect"**

### Step 3: Configure Your Service

Fill in the following details:

- **Name**: `routine-generator` (or any name you prefer)
- **Environment**: `Python`
- **Region**: Choose the region closest to your users
- **Branch**: `master` (or `main` if that's your default branch)
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `gunicorn app:app`

### Step 4: Set Environment Variables (Optional)

In the **Environment Variables** section, you can add:

- `PYTHON_VERSION`: `3.13.1`
- `FLASK_ENV`: `production`

### Step 5: Deploy

1. Click **"Create Web Service"**
2. Render will automatically build and deploy your application
3. The build process will take a few minutes

## 🌐 Access Your Application

Once deployment is complete:

1. You'll get a URL like: `https://routine-generator-xxxx.onrender.com`
2. Your application will be live and accessible worldwide!

## 🔍 Troubleshooting

### Common Issues and Solutions

**Build Fails:**
- Check that all dependencies in `requirements.txt` are compatible
- Ensure Python version in `runtime.txt` is supported by Render

**Application Won't Start:**
- Verify the `Procfile` contains: `web: gunicorn app:app`
- Check that your main Flask app variable is named `app`

**Static Files Not Loading:**
- Ensure your `static` folder is included in the repository
- Check file paths in your templates

### Viewing Logs

1. Go to your service dashboard on Render
2. Click on **"Logs"** tab to see real-time application logs
3. Use logs to debug any issues

## 🔄 Updating Your Application

To update your deployed application:

1. Push changes to your GitHub repository
2. Render will automatically detect changes and redeploy
3. No manual intervention needed!

## 📊 Monitoring

Render provides:
- **Metrics**: CPU, memory usage, and response times
- **Logs**: Real-time application and system logs
- **Health Checks**: Automatic monitoring of your application

## 💰 Pricing

- **Free Tier**: 750 hours/month (enough for personal projects)
- **Paid Plans**: Starting at $7/month for always-on services
- No credit card required for free tier

## 🎉 Success!

Your Exam Routine Generator is now deployed and accessible worldwide!

---

## 📞 Support

If you encounter any issues:
1. Check Render's [documentation](https://render.com/docs)
2. Review the troubleshooting section above
3. Check your application logs in the Render dashboard
