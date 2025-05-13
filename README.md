# Welcome to Swiss Mud Client

### Prerequisite
- Swiss Mud Client needs [Swiss Mud Proxy](https://github.com/lonelytango/swiss-mud-proxy) to work.
- Install [fly.io CLI](https://fly.io/docs/flyctl/)
- Install [Bun](https://bun.sh/docs/installation)

### Repository Setup
```
git clone git@github.com:lonelytango/swiss-mud-client.git
```
- Rename your application to a new name, you can change that in `package.json`. Let say you want to change your app's name to `boom-app`, update it:
```
// package.json
{
  "name": "boom-app",
  ...
}
```

## Local Development

### Install pacakges
- On root directory
```
bun install
```

### Run WebSocket Proxy
- Open [Swiss Mud Proxy](https://github.com/lonelytango/swiss-mud-proxy) and follow the Read Me.
- Run the proxy locally in terminal and keep it open.

### Run app locally
- Open a new terminal window:
```
bun run dev
```
You should see the app run:
```
  VITE v6.3.5  ready in 135 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```
Note that `vite` build tool is being used, now your app should be able to access via browser on `http://localhost:5173/`.

## Remote Deployment (fly.io)

Please note that the following process will not be applicable if you want to use other web services.

### Add environment variable to `.env`
- In root directory `./`, create a new file called `.env`.
- Copy the content of `./env.sample` to `.env`.
- Paste the remote websocket address to the `VITE_WS_URL` value.
Ex: If your websocket address is `wss://boom-app.fly.dev`, your `.env` should look like
```
VITE_WS_URL=wss://boom-app.fly.dev
```

- Login to fly.io in terminal.
```
fly auth login
```

- Follow the screen to open the browser and login. After login you should see:
```
Waiting for session... Done
successfully logged in as <your email>
```

### Deploy your app to fly.io
- First make sure the `.env` file has the web socket proxy url. In your `.env` file, you should see:
```
VITE_WS_URL=<your ws proxy url>
```

- Run deployment script:
```
npm run deploy
```