# Sample - Login

The purpose of this article is to demonstrate how simple it is to set up and use the new Single Page Application SDK, and authenticate a user in your application using Authc's Universal Login Page.

## Running the Sample Application

The sample can be run locally, by cloning the repository to your machine and then following the steps below.

### Specifying Authc Credentials

To specify the application client ID and domain, make a copy of `auth_config.json.example` and rename it to `auth_config.json`. Then open it in a text editor and supply the values for your application:

```json
{
  "domain": "{DOMAIN}",
  "clientId": "{CLIENT_ID}"
}
```

### Installation

After cloning the repository, run:

```bash
$ npm install
```

This will install all of the necessary packages in order for the sample to run.

### Running the Application

This version of the application uses an [Express](https://expressjs.com) server that can serve the site from a single page. To start the app from the terminal, run:

```bash
$ npm run dev
```

### Tips

If you lose the login status after refreshing, you need to clear the cookies, refresh the page and log in again.
