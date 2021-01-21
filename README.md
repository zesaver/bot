ParkingFinesBot
===============

Installation
------------

###Docker installation:

This is the recommended way of installation and execution of the bot.

Get the credentials file required for the services access and update `config.js` file in the *bot* folder with it.

Then execute in the git's root folder:

```bash
docker-compose up
```

###Manual installation

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

Testing
-------

**For tests**:

Execute the command below:

```
mvn -f ./API/BotAPIAutoTests/pom.xml clean install -Dmaven.test.skip=false -Dapi.host="quilcode.com" -Dapi.port="8087" -Ddb.port="8688" -Dapi.host.full="http://quilcode.com:8087"
```

ToDo
----

- Test results to Gitlab Pages
