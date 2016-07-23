# Ember-simple-auth-2fa-demo

This simple demo application is meant to show how ember-simple-auth can integrate with Two-Factor Authentication using OAuth 2.0

**You can visit the app live: https://www.justinbull.ca/ember-simple-auth-2fa-demo/**

## Big Caveat!

You will notice this app is powered by a version of ember-simple-auth **not yet released!** Version 1.2.0 will support the `rejectWithXhr` option and `authenticate` headers argument required to work with 2FA over OAuth 2.0

## Code of Interest

The TL;DR is the use of `X-` headers in [LoginController](app/controllers/login.js) and turning on the `rejectWithXhr` option in the OAuth2 authenticator.

```js
// app/controllers/login.js
import Ember from 'ember';

export default Ember.Controller.extend({
  // ...

  actions: {
    // ...
    authenticate() {
      this.send('dismissError');
      let headers = {};
      if (this.get('twoFactorRequired')) {
        headers['X-JustinInc-OTP'] = this.get('verificationCode');
      }
      let { identification, password } = this.getProperties('identification', 'password');
      this.get('session').authenticate('authenticator:oauth2', identification, password, undefined, headers).then(() => {
        this.transitionToRoute('index');
      }, (failedXhr) => {
        // ember-simple-auth will reject with strings if something truly bad happens
        if (Ember.typeOf(failedXhr) === 'string') {
          this.set('errorMessage', failedXhr);
          return;
        }
        // This is the "error" stating that a 2FA code is required
        if (failedXhr.getResponseHeader('X-JustinInc-OTP') === 'required') {
          this.set('twoFactorRequired', true);
          return;
        }
        // The 2FA code was provided along with user & pass, but was wrong
        if (failedXhr.getResponseHeader('X-JustinInc-OTP') === 'invalid') {
          this.set('errorMessage', 'Verification code is missing, invalid or expired');
          return;
        }
        this.set('errorMessage', failedXhr.responseJSON.error_description || failedXhr.responseText);
      });
    }
  }
});
```

## Prerequisites

You will need the following things properly installed on your computer.

* [Git](http://git-scm.com/)
* [Node.js](http://nodejs.org/) (with NPM)
* [Bower](http://bower.io/)
* [Ember CLI](http://ember-cli.com/)
* [PhantomJS](http://phantomjs.org/)

## Installation

* `git clone <repository-url>` this repository
* change into the new directory
* `npm install`
* `bower install`

## Running / Development

* `ember server`
* Visit your app at [http://localhost:4200](http://localhost:4200).
