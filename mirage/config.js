import Mirage from 'ember-cli-mirage';

export default function() {
  this.timing = 400;      // delay for each request, automatically set to 0 during testing

  /**
   * This is intended to emulate the OAuth 2.0 authentication server
   *
   * It will either fail or succeed with the appropriate optional X- headers
   * depending on who is trying to login.
   *
   * There are two users, both have the password "password":
   *
   * 1. "adalovelace" who has 2FA enabled
   * 2. "insecure_isaak" who does not
   *
   * You'll see that "adalovelace" needs to authenticate twice, with the second
   * time providing the TOTP code (via the header) in addition to her username
   * and password.
   *
   * In real life, the backend would send a random, time-based SMS code to Ada
   * or she would whip out her 2FA Smartphone App but for this demo it's been
   * hard-coded to "158272".
   */
  this.post('/token', (schema, request) => {
    // too lazy to properly parse request body
    const code = request.requestHeaders["X-JustinInc-OTP"],
      username = request.requestBody.split("&")[1].split("=")[1],
      password = request.requestBody.split("&")[2].split("=")[1];

    const failedResponseBody = {
      error: 'invalid_grant',
      error_description: "Unable to login with those credentials."
    };
    const successResponseBody = {
      access_token: 'a7cedeb318dad58ffa8d5727f1efc39951b7eb468a3e0eb67c93691993556a34',
      created_at: Math.floor(new Date().getTime() / 1000),
      expires_in: 43200,
      token_type: 'bearer'
    };

    // Person has 2FA who supplied correct user & pass
    if (username === 'adalovelace' && password === 'password') {
      // They also sent their 2FA code! This will fail the first time as there's
      // no way to know if an account needs 2FA without failing at least once.
      if (code === '158272') {
        return new Mirage.Response(
          200,
          { },
          successResponseBody
        );
      }
      // Aw shucks, they got their 2FA code wrong or its missing
      return new Mirage.Response(
        401,
        { 'X-JustinInc-OTP': (code === undefined) ? 'required' : 'invalid' },
        failedResponseBody
      );
    }
    // Person doesn't have 2FA who supplied correct user & pass
    if (username === 'insecure_isaak' && password === 'password') {
      return new Mirage.Response(
        200,
        { },
        successResponseBody
      );
    }

    // Didn't match anyone in the "database" ;-)
    return new Mirage.Response(401, { }, failedResponseBody);
  });
}
