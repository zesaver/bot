ParkingFinesBot
===============

Installation
------------

### Docker installation:

This is the recommended way of installation and execution of the bot.

Get the credentials file required for the services access and update `config.js` file in the *bot* folder with it.

Then execute in the git's root folder:

```bash
docker-compose up
```

### Manual installation

**Pre-requisites**:

The following services are required to launch the bot:

- node.js (>=12.18.2)
- MongoDB (>=4.2.9)

**Step by step instalation**

Get the credentials file required for the services access and update `config.js` file in the *bot* folder with it.

Then execute:

```bash
npm install
```

grant writing rights for *node_modules* folders.

**Running**

You can start the server with at any time with

```bash
node server/index.js
```

or `npm start`.
