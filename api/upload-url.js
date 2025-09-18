{
  "functions": {
    "server/api/**/*.js": {
      "runtime": "nodejs18.x"
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/server/api/$1"
    }
  ]
}