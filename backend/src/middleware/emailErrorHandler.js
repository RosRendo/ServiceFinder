const emailErrorHandler = (err, req, res, next) => {
  if (err.code === 'EAUTH') {
    console.error('❌ Email authentication failed');
    return res.status(500).json({ 
      error: 'Email service configuration error' 
    });
  }

  if (err.code === 'ESOCKET') {
    console.error('❌ Email connection failed');
    return res.status(500).json({ 
      error: 'Unable to send email at this time' 
    });
  }

  next(err);
};

module.exports = emailErrorHandler;