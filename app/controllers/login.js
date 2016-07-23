import Ember from 'ember';

export default Ember.Controller.extend({
  session: Ember.inject.service('session'),
  identification: '',
  password: '',
  twoFactorRequired: false,
  verificationCode: null,

  actions: {
    dismissError() {
      this.set('errorMessage', null);
    },

    dismissTip() {
      this.set('hideDemoTip', true);
    },

    cancelLogin() {
      this.setProperties({
        errorMessage: null,
        verificationCode: null,
        twoFactorRequired: false,
        username: '',
        password: '',
      });
    },

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
          this.set('hideDemoTip', false); // not needed for a real app. duh.
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
