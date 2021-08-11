module.exports = (crowi, app) => {
  const PasswordResetOrder = crowi.model('PasswordResetOrder');

  // need refuctoring with http-error by GW-7091

  return async(req, res, next) => {
    const { token } = req.params;

    if (token == null) {
      return res.redirect('/login');
    }

    const passwordResetOrder = await PasswordResetOrder.findOne({ token });
    // check the oneTimeToken is valid
    if (passwordResetOrder == null || passwordResetOrder.isExpired() || passwordResetOrder.isRevoked) {
      return res.redirect('/forgot-password/error/password-reset-order');
    }

    req.DataFromPasswordResetOrderMiddleware = passwordResetOrder;

    return next();
  };
};
