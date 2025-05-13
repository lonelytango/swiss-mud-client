## fly.io deployment

### Install fly.io cli on homebrew

[fly.io cli](https://fly.io/docs/flyctl/)

Login to fly.io in terminal
`fly auth login`

After login you should see:

```
Waiting for session... Done
successfully logged in as <your email>
```

### deploy your app to fly.io

- First make sure the `.env` file has the web socket proxy url. In your `.env` file, you should see:
  VITE_WS_URL=<your ws proxy url>

- Run deployment script:
  `sh ./deploy.sh`
